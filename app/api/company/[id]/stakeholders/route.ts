import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import {
  getCompanyStakeholders,
  addCompanyStakeholder,
  type CompanyStakeholderUpsertDto,
} from '@/services/company-api';
import { apiErrorResponse } from '@/lib/api-error';

/**
 * Collection endpoint for a company's stakeholders.
 *
 * GET   — list (optional ?type= filter; matches StakeholderType.Code or its
 *         Persian translation, so the brokerages members-info page can pull
 *         "Shareholder"-only rows regardless of UI language).
 * POST  — create a stakeholder + initial history row for this company.
 *
 * Per-item operations (PUT / DELETE) live at the sub-route
 * `[stakeholderId]/route.ts` so the URL carries the identifier — mirrors the
 * backend (`PUT /Api/CompanyStakeholderManagement/{stakeholderId}`).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: companyId } = await params;
    const url = new URL(req.url);
    const typeFilter = url.searchParams.get('type');
    const languageId = Number(url.searchParams.get('languageId') ?? 12);

    const rows = await getCompanyStakeholders(session.accessToken, companyId, languageId);

    let filtered = rows;
    if (typeFilter) {
      const needle = typeFilter.toLowerCase();
      const faEquivalents: Record<string, string[]> = {
        shareholder: ['سهامدار'],
        parent:      ['شرکت مادر'],
        subsidiary:  ['شرکت فرعی'],
        investor:    ['سرمایه‌گذار'],
        partner:     ['شریک'],
        franchisor:  ['فرانچایزر'],
        franchisee:  ['فرانچایزی'],
        other:       ['سایر'],
      };
      const extraNeedles = faEquivalents[needle] ?? [];
      filtered = rows.filter((r) => {
        const name = (r.stakeholderTypeName ?? '').toLowerCase();
        return name === needle || extraNeedles.some((alt) => name === alt.toLowerCase());
      });
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('[company/[id]/stakeholders] GET error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to load stakeholders' },
      { status: 500 },
    );
  }
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
    const body = (await req.json()) as CompanyStakeholderUpsertDto;
    const result = await addCompanyStakeholder(session.accessToken, companyId, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('[company/[id]/stakeholders] POST error:', error);
    return apiErrorResponse(error);
  }
}
