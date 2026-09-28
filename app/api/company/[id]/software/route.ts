import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { getCompanySoftware, upsertCompanySoftware, clearCompanySoftware } from '@/services/company-api';
import { apiErrorResponse } from '@/lib/api-error';

/** GET /api/company/{id}/software — the 9 category slots (left-joined to the company's picks). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const slots = await getCompanySoftware(session.accessToken, id);
    return NextResponse.json(slots);
  } catch (error: unknown) {
    return apiErrorResponse(error, 'fetching company software');
  }
}

/** PUT /api/company/{id}/software — upsert the software chosen for a category. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    await upsertCompanySoftware(session.accessToken, id, body);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'saving company software');
  }
}

/** DELETE /api/company/{id}/software?categoryId=... — clear the pick for a category. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const categoryId = Number(searchParams.get('categoryId'));
    await clearCompanySoftware(session.accessToken, id, categoryId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'clearing company software');
  }
}
