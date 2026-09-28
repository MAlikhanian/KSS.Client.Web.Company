import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { listCompanyDocumentTypeTranslations } from '@/services/company-api';
import { apiErrorResponse } from '@/lib/api-error';

// GET: fa/en document-type translations for the company documents dropdown.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const translations = await listCompanyDocumentTypeTranslations(session.accessToken);
    return NextResponse.json(translations);
  } catch (error) {
    return apiErrorResponse(error, 'company/document-types GET');
  }
}
