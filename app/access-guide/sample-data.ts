// Sample (fake) data for the read-only access-management guide page.
// Feeds the real access sections in controlled + read-only mode (rows prop), so
// no API call is made and the tables show realistic example grants.

import type { AccessGrantRow } from '../access/components/access-management-section';
import type { RoleAccessRow } from '../access/components/role-access-management-section';

// Levels: 0 = none, 1 = view, 2 = edit.
export const sampleAccessRows: AccessGrantRow[] = [
  {
    grantedToPersonId: 'demo-person-1',
    personDisplay: 'محمد علی‌خانیان (۱۲۳۴۵۶۷۸۹)',
    informationLevel: 2,
    accessLevel: 1,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: null,
  },
  {
    grantedToPersonId: 'demo-person-2',
    personDisplay: 'سارا رضایی (۹۸۷۶۵۴۳۲۱)',
    informationLevel: 1,
    accessLevel: 0,
    createdAt: '2024-02-15T08:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
  },
];

export const sampleRoleRows: RoleAccessRow[] = [
  {
    grantedToRoleId: 'demo-role-1',
    roleDisplay: 'کارشناس اعتبارسنجی',
    companyId: 'demo-company',
    informationLevel: 1,
    accessLevel: 0,
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: null,
  },
  {
    grantedToRoleId: 'demo-role-2',
    roleDisplay: 'مدیر سیستم',
    companyId: null, // global scope — applies to all companies
    informationLevel: 2,
    accessLevel: 2,
    createdAt: '2023-12-01T08:00:00Z',
    updatedAt: null,
  },
];
