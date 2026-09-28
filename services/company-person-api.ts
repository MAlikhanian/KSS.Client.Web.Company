/**
 * KSS Person Service — CompanyPerson (tenant assignment) endpoints.
 * Server-side only. Base URL from PERSON_API_BASE_URL. JWT Bearer required.
 */

function getBaseUrl(): string {
  const baseUrl = process.env.PERSON_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('PERSON_API_BASE_URL environment variable is required but not set.');
  }
  return baseUrl;
}

function getHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function throwApiError(response: Response, defaultMessage: string) {
  const text = await response.text().catch(() => response.statusText);
  if (response.status === 401) {
    throw new Error('Authentication token expired. Please log in again.');
  }
  let message = defaultMessage;
  try {
    message = JSON.parse(text).message || message;
  } catch {
    message = text || message;
  }
  throw new Error(message);
}

/** GET /Api/CompanyPerson/MyCompanies — company ids the current user (person) is assigned to. */
export async function getMyCompanyIds(token: string): Promise<string[]> {
  const res = await fetch(`${getBaseUrl()}/Api/CompanyPerson/MyCompanies`, {
    method: 'GET',
    headers: getHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) await throwApiError(res, 'Failed to fetch my companies');
  return res.json();
}

/** GET /Api/CompanyPerson/PersonsByCompany/{companyId} — person ids assigned to a company. */
export async function getPersonIdsByCompany(token: string, companyId: string): Promise<string[]> {
  const res = await fetch(`${getBaseUrl()}/Api/CompanyPerson/PersonsByCompany/${companyId}`, {
    method: 'GET',
    headers: getHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) await throwApiError(res, 'Failed to fetch persons by company');
  return res.json();
}

/** POST /Api/CompanyPerson/Assign — assign a person to a company. */
export async function assignPersonToCompany(token: string, companyId: string, personId: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/Api/CompanyPerson/Assign`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ companyId, personId }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to assign person to company');
}

/** POST /Api/CompanyPerson/Unassign/{companyId}/{personId} — remove a person from a company. */
export async function unassignPersonFromCompany(token: string, companyId: string, personId: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/Api/CompanyPerson/Unassign/${companyId}/${personId}`, {
    method: 'POST',
    headers: getHeaders(token),
  });
  if (!res.ok) await throwApiError(res, 'Failed to unassign person from company');
}
