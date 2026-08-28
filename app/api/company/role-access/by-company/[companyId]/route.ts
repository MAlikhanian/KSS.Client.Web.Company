import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { listCompanyRoleAccessByCompany } from '@/services/company-api';

// GET /api/company/role-access/by-company/{companyId} —
// per-company + global role grants for this company's access page.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = await params;
    if (!companyId) {
      return NextResponse.json({ message: 'companyId is required' }, { status: 400 });
    }

    const data = await listCompanyRoleAccessByCompany(session.accessToken, companyId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error listing company role access grants:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 },
    );
  }
}
