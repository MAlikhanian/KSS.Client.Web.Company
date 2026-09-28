import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import {
  updateCompanyStakeholder,
  deleteCompanyStakeholder,
  type CompanyStakeholderUpsertDto,
} from '@/services/company-api';
import { apiErrorResponse } from '@/lib/api-error';

/**
 * Per-item operations on a single stakeholder of a company.
 *
 * PUT    /api/company/{id}/stakeholders/{stakeholderId}
 *   — updates the stakeholder; the management service appends a new history
 *     row (closing the previous current row with EndDate = today) whenever
 *     any history-shaped field changes.
 *
 * DELETE /api/company/{id}/stakeholders/{stakeholderId}
 *   — soft-deletes the stakeholder and cascades to its history rows.
 *
 * The companyId in the path is not forwarded (the backend resolves it from
 * the stakeholder row) but is required by the URL shape so callers can route
 * intent + scope from the same URL.
 */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stakeholderId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { stakeholderId } = await params;
    const body = (await req.json()) as CompanyStakeholderUpsertDto;
    const result = await updateCompanyStakeholder(session.accessToken, stakeholderId, body);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[company/[id]/stakeholders/[stakeholderId]] PUT error:', error);
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stakeholderId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { stakeholderId } = await params;
    await deleteCompanyStakeholder(session.accessToken, stakeholderId);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    console.error('[company/[id]/stakeholders/[stakeholderId]] DELETE error:', error);
    return apiErrorResponse(error);
  }
}
