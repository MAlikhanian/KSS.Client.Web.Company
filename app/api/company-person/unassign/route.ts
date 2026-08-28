import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { unassignPersonFromCompany } from '@/services/company-person-api';

// POST /api/company-person/unassign  { companyId, personId }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { companyId, personId } = (await request.json()) ?? {};
    if (!companyId || !personId) {
      return NextResponse.json({ message: 'companyId and personId are required' }, { status: 400 });
    }
    await unassignPersonFromCompany(session.accessToken, companyId, personId);
    return NextResponse.json({ message: 'Person removed from company.' });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 },
    );
  }
}
