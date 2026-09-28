import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import {
  getCompanyDetail,
  updateCompanyDetail,
  listCompanyNameHistoryTranslations,
} from '@/services/company-api';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const company = await getCompanyDetail(accessToken, id);

    // Enrich nameHistory with all translations per entry (default GET only returns one language)
    const nameHistoryWithTranslations = await Promise.all(
      (company.nameHistory || []).map(async (nh) => {
        try {
          const translations = await listCompanyNameHistoryTranslations(accessToken, {
            nameHistoryId: nh.id,
          });
          return {
            ...nh,
            translations: translations.map((t) => ({
              languageId: t.languageId,
              name: t.name,
            })),
          };
        } catch {
          return {
            ...nh,
            translations: [{ languageId: 12, name: nh.name }],
          };
        }
      }),
    );

    return NextResponse.json({
      id: company.id,
      companyPersianName: company.companyPersianName,
      companyLatinName: company.companyLatinName || '',
      formerNames: company.formerNames || '',
      registrationDate: company.registrationDate,
      registrationNumber: company.registrationNo,
      nationalId: company.nationalId,
      economicCode: company.economicCode,
      registrationCountry: company.registrationCountryId?.toString() || '',
      registrationRegion: company.registrationRegionId?.toString() || '',
      registrationCity: company.registrationCityId?.toString() || '',
      isActive: company.isActive,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      nameHistory: nameHistoryWithTranslations,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'fetching company');
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const body = await req.json();

    const updateData = {
      id,
      registrationDate: body.registrationDate || new Date().toISOString(),
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
      isActive: body.isActive ?? true,
    };

    const result = await updateCompanyDetail(accessToken, id, updateData);

    return NextResponse.json({
      id: result.id,
      companyPersianName: result.companyPersianName,
      companyLatinName: result.companyLatinName || '',
      nationalId: result.nationalId,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'updating company');
  }
}
