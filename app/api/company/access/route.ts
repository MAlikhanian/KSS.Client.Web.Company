import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import {
  listCompanyAccessGrantsByCompany,
  upsertCompanyAccessGrant,
} from '@/services/company-api';

// GET /api/company/access?companyId=… — list grants given out for companyId.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = request.nextUrl.searchParams.get('companyId');
    if (!companyId) {
      return NextResponse.json({ message: 'companyId is required' }, { status: 400 });
    }

    const data = await listCompanyAccessGrantsByCompany(session.accessToken, companyId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error listing company access grants:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 },
    );
  }
}

// POST /api/company/access — upsert per-section grant. Body shape: AccessGrantDto.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await upsertCompanyAccessGrant(session.accessToken, body);
    return NextResponse.json({ message: 'Access grant saved.' }, { status: 200 });
  } catch (error) {
    console.error('Error granting company access:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 },
    );
  }
}
