import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { createCompany } from '@/services/company-api';
import { apiErrorResponse } from '@/lib/api-error';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const accessToken = session.accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { message: 'No access token available. Please sign in again.' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { companyPersianName, companyLatinName } = body;

    // The Persian company name is the only hard requirement to create a record;
    // everything else can be completed later on the edit page.
    if (!companyPersianName) {
      return NextResponse.json(
        { message: 'Company Persian name is required' },
        { status: 400 },
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const startDate = body.registrationDate || today;

    // Primary name lives in dbo.Translation (Persian = languageId 12, Latin = 10).
    // No ids are sent — the backend generates the company id + name-history id (v7).
    const translations = [
      { languageId: 12, name: companyPersianName },
    ];
    if (companyLatinName) {
      translations.push({ languageId: 10, name: companyLatinName });
    }

    // Seed the initial name-history entry so the name shows on the edit page's
    // history-driven name section. The backend assigns the name-history id and
    // links the translations.
    const nameHistoryTranslations = [
      { languageId: 12, name: companyPersianName },
    ];
    if (companyLatinName) {
      nameHistoryTranslations.push({ languageId: 10, name: companyLatinName });
    }

    const insertDto = {
      legalFormId: 1, // Default legal form; refine later on the edit page.
      registrationDate: startDate,
      registrationNo: body.registrationNumber || '',
      nationalId: body.nationalId || '',
      economicCode: body.economicCode || '',
      registrationCountryId: body.registrationCountry
        ? parseInt(body.registrationCountry)
        : 0,
      registrationRegionId: body.registrationRegion
        ? parseInt(body.registrationRegion)
        : 0,
      registrationCityId: body.registrationCity
        ? parseInt(body.registrationCity)
        : 0,
      foundedDate: null,
      isActive: true,
      translations,
      nameHistory: {
        startDate,
        endDate: null,
        translations: nameHistoryTranslations,
      },
    };

    const result = await createCompany(accessToken, insertDto);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'creating company');
  }
}
