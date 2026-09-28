import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { getSoftwareCatalog } from '@/services/company-api';
import { apiErrorResponse } from '@/lib/api-error';

// Read-only: the software catalog (active software + provider company) is
// managed by admins directly in the DB. Users only SELECT existing software
// via the provider→software cascade on the company-software page, so this
// route exposes GET only — no add/update from the UI.
/** GET /api/company/software — software catalog (id, name, companyId, companyName) for the cascade dropdowns. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const catalog = await getSoftwareCatalog(session.accessToken);
    return NextResponse.json(catalog);
  } catch (error: unknown) {
    return apiErrorResponse(error, 'fetching software catalog');
  }
}
