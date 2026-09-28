// Sample (fake) data for the read-only company-information guide page.
// Nothing here is persisted — it only feeds the real, read-only controls so a
// first-time user can see how the page looks once a company is filled in.

import type { StakeholderItem } from '@/components/common/company-info';

export interface SampleTranslation {
  languageId: number;
  name: string;
}

export interface SampleNameHistory {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description?: string;
  translations?: SampleTranslation[];
  createdAt?: string;
  updatedAt?: string | null;
}

export interface SampleEmail {
  id: string;
  labelId: number;
  labelName: string;
  emailAddress: string;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface SamplePhone {
  id: string;
  labelId: number;
  labelName: string;
  countryId: number;
  phoneNumber: string;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface SampleAddress {
  id: string;
  labelId: number;
  labelName: string;
  countryId: number;
  regionId: number;
  cityId: number;
  countryName?: string;
  regionName?: string;
  cityName?: string;
  postalCode: string;
  street1: string;
  street2: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

/** Demo company name shown in the static "selection" representation. */
export const SAMPLE_COMPANY_NAME = 'شرکت نمونهٔ پارس';

// Persian language id = 12, English = 10 (per the name-history grid mapping).
export const sampleNameHistory: SampleNameHistory[] = [
  {
    id: 'demo-name-1',
    name: 'شرکت نمونهٔ پارس',
    startDate: '2015-03-21',
    endDate: null,
    isCurrent: true,
    description: 'نام فعلی شرکت',
    translations: [
      { languageId: 12, name: 'شرکت نمونهٔ پارس' },
      { languageId: 10, name: 'Pars Sample Co.' },
    ],
    createdAt: '2015-03-21T08:00:00Z',
    updatedAt: '2020-01-12T10:30:00Z',
  },
  {
    id: 'demo-name-2',
    name: 'پارس تجارت',
    startDate: '2010-06-01',
    endDate: '2015-03-20',
    isCurrent: false,
    description: 'نام پیشین، پیش از تغییر',
    translations: [{ languageId: 12, name: 'پارس تجارت' }],
    createdAt: '2010-06-01T08:00:00Z',
    updatedAt: null,
  },
];

export const sampleRegistration = {
  registrationDate: '2015-03-21',
  registrationNumber: '543210',
  // Cascading location selects resolve their own option names from the API; left
  // empty in the demo so the read-only selects show their guiding placeholders.
  registrationCountry: '',
  registrationRegion: '',
  registrationCity: '',
  nationalId: '10861234567',
  economicCode: '411234567890',
};

export const sampleEmails: SampleEmail[] = [
  {
    id: 'demo-email-1',
    labelId: 1,
    labelName: 'اصلی',
    emailAddress: 'info@pars-sample.ir',
    isPrimary: true,
    isVerified: true,
    createdAt: '2023-01-10T08:00:00Z',
    updatedAt: '2023-06-01T10:00:00Z',
  },
  {
    id: 'demo-email-2',
    labelId: 4,
    labelName: 'پشتیبانی',
    emailAddress: 'support@pars-sample.ir',
    isPrimary: false,
    isVerified: false,
    createdAt: '2023-02-15T08:00:00Z',
    updatedAt: null,
  },
];

export const samplePhones: SamplePhone[] = [
  {
    id: 'demo-phone-1',
    labelId: 1,
    labelName: 'تلفن ثابت',
    countryId: 98,
    phoneNumber: '+982188776655',
    isPrimary: true,
    isVerified: true,
    createdAt: '2023-01-10T08:00:00Z',
    updatedAt: null,
  },
  {
    id: 'demo-phone-2',
    labelId: 2,
    labelName: 'موبایل',
    countryId: 98,
    phoneNumber: '+989121234567',
    isPrimary: false,
    isVerified: false,
    createdAt: '2023-03-01T08:00:00Z',
    updatedAt: null,
  },
];

export const sampleAddresses: SampleAddress[] = [
  {
    id: 'demo-address-1',
    labelId: 1,
    labelName: 'دفتر مرکزی',
    countryId: 1,
    regionId: 1,
    cityId: 1,
    countryName: 'ایران',
    regionName: 'تهران',
    cityName: 'تهران',
    postalCode: '1512345678',
    street1: 'خیابان ولیعصر، بالاتر از میدان ونک',
    street2: 'پلاک ۱۲۰، طبقهٔ ۴',
    isPrimary: true,
    isVerified: true,
    createdAt: '2023-01-10T08:00:00Z',
    updatedAt: null,
  },
  {
    id: 'demo-address-2',
    labelId: 2,
    labelName: 'شعبه',
    countryId: 1,
    regionId: 2,
    cityId: 5,
    countryName: 'ایران',
    regionName: 'اصفهان',
    cityName: 'اصفهان',
    postalCode: '8138975312',
    street1: 'خیابان چهارباغ بالا',
    street2: null,
    isPrimary: false,
    isVerified: false,
    createdAt: '2023-04-10T08:00:00Z',
    updatedAt: null,
  },
];

export const sampleStakeholders: StakeholderItem[] = [
  {
    id: 'demo-stakeholder-1',
    companyId: 'demo-company',
    relatedPartyType: 2, // person
    relatedPartyId: 'demo-person-1',
    stakeholderTypeId: 5, // shareholder
    stakeholderTypeName: 'سهامدار',
    current: {
      id: 'demo-sh-hist-1',
      ownershipPercentage: 35.5,
      shareCount: 355000,
      boardRepresentativePersonId: null,
      registrationDate: '2019-05-01',
      effectiveDate: '2019-05-01',
      endDate: null,
      createdAt: '2019-05-01T08:00:00Z',
      updatedAt: null,
    },
    history: [
      {
        id: 'demo-sh-hist-1',
        ownershipPercentage: 35.5,
        shareCount: 355000,
        boardRepresentativePersonId: null,
        registrationDate: '2019-05-01',
        effectiveDate: '2019-05-01',
        endDate: null,
      },
      {
        id: 'demo-sh-hist-0',
        ownershipPercentage: 20,
        shareCount: 200000,
        boardRepresentativePersonId: null,
        registrationDate: '2017-01-01',
        effectiveDate: '2017-01-01',
        endDate: '2019-04-30',
      },
    ],
  },
  {
    id: 'demo-stakeholder-2',
    companyId: 'demo-company',
    relatedPartyType: 1, // company
    relatedPartyId: 'demo-related-company-1',
    stakeholderTypeId: 1, // parent
    stakeholderTypeName: 'شرکت مادر',
    current: {
      id: 'demo-sh-hist-2',
      ownershipPercentage: 51,
      shareCount: 510000,
      boardRepresentativePersonId: null,
      registrationDate: '2018-01-01',
      effectiveDate: '2018-01-01',
      endDate: null,
      createdAt: '2018-01-01T08:00:00Z',
      updatedAt: null,
    },
    history: [],
  },
];
