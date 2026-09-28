import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import {
  addNameWithTranslations,
  upsertNameTranslations,
  updateCompanyNameHistory,
  removeNameTranslation,
  deleteCompanyNameHistory,
} from '@/services/company-api';
import { apiErrorResponse } from '@/lib/api-error';

interface TranslationEntry {
  languageId: number;
  name: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: companyId } = await params;
    const body = await req.json();
    const { translations, startDate, endDate, description } = body as {
      translations: TranslationEntry[];
      startDate: string;
      endDate: string | null;
      description?: string;
    };

    if (!translations || translations.length === 0 || !startDate) {
      return NextResponse.json({ message: 'translations and startDate are required' }, { status: 400 });
    }

    // No id is generated here — the backend assigns the name-history id (v7).
    await addNameWithTranslations(session.accessToken, {
      companyId,
      startDate,
      endDate: endDate || null,
      description: description || null,
      translations: translations
        .filter((tr) => tr.name.trim())
        .map((tr) => ({ languageId: tr.languageId, name: tr.name.trim() })),
    });

    return NextResponse.json({ companyId, translations, startDate, endDate, description }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error adding name history:', error);
    return apiErrorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: companyId } = await params;
    const body = await req.json();
    const { itemId, translations, startDate, endDate, description } = body as {
      itemId: string;
      translations: TranslationEntry[];
      startDate: string;
      endDate: string | null;
      description?: string;
    };

    if (!itemId || !translations || translations.length === 0 || !startDate) {
      return NextResponse.json({ message: 'itemId, translations, and startDate are required' }, { status: 400 });
    }

    // Persist the name-history record itself (start/end date + description).
    // Run before the translation upsert so the current-name sync reflects it.
    await updateCompanyNameHistory(session.accessToken, {
      id: itemId,
      companyId,
      startDate,
      endDate: endDate || null,
      description: description ?? null,
    });

    await upsertNameTranslations(session.accessToken, {
      nameHistoryId: itemId,
      companyId,
      translations: translations
        .filter((tr) => tr.name.trim())
        .map((tr) => ({ languageId: tr.languageId, name: tr.name.trim() })),
    });

    return NextResponse.json({ id: itemId, companyId, translations, startDate, endDate, description });
  } catch (error: unknown) {
    console.error('Error updating name history:', error);
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: companyId } = await params;
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ message: 'itemId is required' }, { status: 400 });
    }

    await deleteCompanyNameHistory(session.accessToken, {
      id: itemId,
      companyId,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting name history:', error);
    return apiErrorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await params;
    const body = await req.json();
    const { itemId, languageId, name } = body as {
      itemId: string;
      languageId: number;
      name: string;
    };

    if (!itemId || !languageId) {
      return NextResponse.json({ message: 'itemId and languageId are required' }, { status: 400 });
    }

    await removeNameTranslation(session.accessToken, {
      nameHistoryId: itemId,
      languageId,
      name: name || '',
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting name history translation:', error);
    return apiErrorResponse(error);
  }
}
