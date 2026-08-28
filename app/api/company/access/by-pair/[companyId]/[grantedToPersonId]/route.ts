import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { revokeCompanyAccessByPair } from '@/services/company-api';

// DELETE /api/company/access/by-pair/{companyId}/{grantedToPersonId} —
// owner-only revoke of all rows for the (companyId, grantee) pair.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ companyId: string; grantedToPersonId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, grantedToPersonId } = await params;
    if (!companyId || !grantedToPersonId) {
      return NextResponse.json(
        { message: 'companyId and grantedToPersonId are required' },
        { status: 400 },
      );
    }

    await revokeCompanyAccessByPair(session.accessToken, companyId, grantedToPersonId);
    return NextResponse.json({ message: 'Access revoked.' });
  } catch (error) {
    console.error('Error revoking company access by pair:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 },
    );
  }
}
