import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { getCompanyMyLevels } from '@/services/company-api';

// GET /api/company/access/my-levels/{companyId} —
// returns { information, access }, each 0=None / 1=View / 2=Edit.
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

    const levels = await getCompanyMyLevels(session.accessToken, companyId);
    return NextResponse.json(levels);
  } catch (error) {
    console.error('Error fetching company access levels:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 },
    );
  }
}
