import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { revokeCompanyRoleAccessByPair } from '@/services/company-api';

// DELETE /api/company/role-access/by-pair?grantedToRoleId=…&companyId=… —
// revoke all rows for the (companyId|null, grantedToRoleId) pair.
// companyId omitted → revokes a global grant.
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const grantedToRoleId = request.nextUrl.searchParams.get('grantedToRoleId');
    const companyId = request.nextUrl.searchParams.get('companyId');

    if (!grantedToRoleId) {
      return NextResponse.json(
        { message: 'grantedToRoleId is required' },
        { status: 400 },
      );
    }

    await revokeCompanyRoleAccessByPair(session.accessToken, grantedToRoleId, companyId);
    return NextResponse.json({ message: 'Role access revoked.' });
  } catch (error) {
    console.error('Error revoking company role access:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 },
    );
  }
}
