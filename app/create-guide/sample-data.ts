// Sample (fake) data for the read-only create-company guide page.
// Nothing is persisted — it only feeds the real BasicInformationSection control
// in disabled mode so a first-time user sees how the form looks filled in.

export const sampleBasicInfo = {
  companyPersianName: 'شرکت نمونهٔ پارس',
  registrationDate: '2015-03-21',
  registrationNumber: '543210',
  nationalId: '10861234567',
  economicCode: '411234567890',
  // Cascading location selects resolve their own names from the API; left empty
  // in the demo so the disabled selects show their guiding placeholders.
  registrationCountry: '',
  registrationRegion: '',
  registrationCity: '',
};
