import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { getCompanySelectList } from '@/services/company-api';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const accessToken = session.accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { message: 'No access token available. Please sign in again.' },
        { status: 401 },
      );
    }

    // CompanySelectService filters by the caller's Access / RoleAccess on
    // the server side using JWT claims, so this proxy is a pass-through.
    const companies = await getCompanySelectList(accessToken, 12, query || undefined);

    return NextResponse.json(
      companies.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        isActive: c.isActive,
        nationalId: c.nationalId || undefined,
        nameHistory: c.nameHistory || [],
      })),
    );
  } catch (error) {
    return apiErrorResponse(error, 'fetching companies');
  }
}
