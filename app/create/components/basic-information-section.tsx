'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePickerComponent } from '@/components/ui/date-picker';
import { LocationSelect } from '@/components/common/location-select';
import { useTranslation } from '@/hooks/useTranslation';

interface BasicInformationFormData {
  companyPersianName: string;
  registrationDate: string;
  registrationNumber: string;
  registrationCountry: string;
  registrationRegion: string;
  registrationCity: string;
  nationalId: string;
  economicCode: string;
}

type BasicInformationField = keyof BasicInformationFormData;

interface BasicInformationSectionProps {
  formData: BasicInformationFormData;
  onInputChange: (field: BasicInformationField, value: string) => void;
  disabled?: boolean;
}

// Dedicated "basic information" section for the create-company page. Merges the
// company name with the registration/legal fields into a single card. Built from
// shared UI primitives only — independent of the edit page's section components.
export function BasicInformationSection({
  formData,
  onInputChange,
  disabled = false,
}: BasicInformationSectionProps) {
  const { t } = useTranslation('company-information');

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('form.sections.basicInfo', { defaultValue: 'Basic Information' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyPersianName">
              {t('form.fields.companyPersianName')}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="companyPersianName"
              type="text"
              dir="rtl"
              value={formData.companyPersianName}
              onChange={(e) => onInputChange('companyPersianName', e.target.value)}
              placeholder={t('form.placeholders.companyPersianName')}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationDate">
              {t('form.fields.registrationDate')}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <DatePickerComponent
              value={formData.registrationDate}
              onChange={(value) => onInputChange('registrationDate', value)}
              placeholder={t('form.placeholders.registrationDate', {
                defaultValue: 'Select registration date',
              })}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNumber">
              {t('form.fields.registrationNumber')}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="registrationNumber"
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => onInputChange('registrationNumber', e.target.value)}
              placeholder={t('form.placeholders.registrationNumber')}
              disabled={disabled}
            />
          </div>

          <LocationSelect
            type="country"
            value={formData.registrationCountry}
            onValueChange={(value) => {
              onInputChange('registrationCountry', value);
              // Clear region and city when country changes
              onInputChange('registrationRegion', '');
              onInputChange('registrationCity', '');
            }}
            label={t('form.fields.registrationCountry', { defaultValue: 'Registration Country' })}
            placeholder={t('form.placeholders.registrationCountry', {
              defaultValue: 'Select registration country',
            })}
            required
            disabled={disabled}
          />

          <LocationSelect
            type="province"
            value={formData.registrationRegion}
            onValueChange={(value) => {
              onInputChange('registrationRegion', value);
              // Clear city when region changes
              onInputChange('registrationCity', '');
            }}
            label={t('form.fields.registrationRegion', { defaultValue: 'Registration Province' })}
            placeholder={t('form.placeholders.registrationRegion', {
              defaultValue: 'Select registration province',
            })}
            countryId={formData.registrationCountry}
            required
            disabled={disabled}
          />

          <LocationSelect
            type="city"
            value={formData.registrationCity}
            onValueChange={(value) => onInputChange('registrationCity', value)}
            label={t('form.fields.registrationCity', { defaultValue: 'Registration City' })}
            placeholder={t('form.placeholders.registrationCity', {
              defaultValue: 'Select registration city',
            })}
            provinceId={formData.registrationRegion}
            required
            disabled={disabled}
          />

          <div className="space-y-2">
            <Label htmlFor="nationalId">
              {t('form.fields.nationalId')}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nationalId"
              type="text"
              value={formData.nationalId}
              onChange={(e) => onInputChange('nationalId', e.target.value)}
              placeholder={t('form.placeholders.nationalId')}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="economicCode">
              {t('form.fields.economicCode')}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="economicCode"
              type="text"
              value={formData.economicCode}
              onChange={(e) => onInputChange('economicCode', e.target.value)}
              placeholder={t('form.placeholders.economicCode')}
              disabled={disabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
