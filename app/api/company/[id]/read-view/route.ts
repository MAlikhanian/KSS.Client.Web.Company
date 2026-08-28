import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { getCompanyReadView } from '@/services/company-api';
import {
  getCachedCountries,
  getCachedRegions,
  getCachedCities,
} from '@/lib/locations-cache';
import { apiErrorResponse } from '@/lib/api-error';

/**
 * Consolidated read-only company view for display screens.
 *
 * Calls KSS.Service.Company for the company data and KSS.Service.Common (via
 * the shared 5-min lookup cache) to resolve country/region/city IDs to names —
 * the Company service does not own those lookup tables, so name resolution
 * happens here at the BFF layer.
 *
 * Response shape is the SHARED CompanyReadView shape with `*Name` fields and
 * nested `registrationCountry / Region / City` objects.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [readView, countries, regions, cities] = await Promise.all([
      getCompanyReadView(session.accessToken, id),
      getCachedCountries(session.accessToken),
      getCachedRegions(session.accessToken),
      getCachedCities(session.accessToken),
    ]);

    const countryNameById = new Map(countries.map((c) => [c.id, c.name]));
    const regionNameById = new Map(regions.map((r) => [r.id, r.name]));
    const cityNameById = new Map(cities.map((c) => [c.id, c.name]));

    const lookupCountry = (id: number) => countryNameById.get(id.toString()) || '';
    const lookupRegion = (id: number) => regionNameById.get(id.toString()) || '';
    const lookupCity = (id: number) => cityNameById.get(id.toString()) || '';

    return NextResponse.json({
      id: readView.id,
      companyPersianName: readView.companyPersianName,
      companyLatinName: readView.companyLatinName || '',
      registrationDate: readView.registrationDate,
      registrationNumber: readView.registrationNo,
      nationalId: readView.nationalId,
      economicCode: readView.economicCode,
      isActive: readView.isActive,

      registrationCountry: {
        id: readView.registrationCountryId,
        name: lookupCountry(readView.registrationCountryId),
      },
      registrationRegion: {
        id: readView.registrationRegionId,
        name: lookupRegion(readView.registrationRegionId),
      },
      registrationCity: {
        id: readView.registrationCityId,
        name: lookupCity(readView.registrationCityId),
      },

      nameHistory: readView.nameHistory,
      emails: readView.emails,
      phones: readView.phones,
      addresses: readView.addresses.map((a) => ({
        ...a,
        countryName: lookupCountry(a.countryId),
        regionName: lookupRegion(a.regionId),
        cityName: lookupCity(a.cityId),
      })),
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'fetching company read-view');
  }
}
