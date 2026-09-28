'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { CompanySelect } from '@/components/common/company-select';
import { useCompanies } from '@/hooks/use-companies';

interface CompanySelectionCardProps {
  value: string;
  onValueChange: (value: string) => void;
  isEditMode?: boolean;
  required?: boolean;
  disabled?: boolean;
}

export function CompanySelectionCard({
  value,
  onValueChange,
  isEditMode = false,
  required = false,
  disabled = false,
}: CompanySelectionCardProps) {
  const { t } = useTranslation('company-information');
  const { companies } = useCompanies();

  const selectedCompany = companies.find((company) => company.id === value);
  const companyName = selectedCompany?.name || '';

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>
          {t('selectCompany.title', {
            defaultValue: 'Select Company',
          })}
        </CardTitle>
        <CardDescription className="mx-auto max-w-2xl">
          {t('selectCompany.description', {
            defaultValue: 'To edit information, select a company from the list.',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <CompanySelect
              value={value}
              onValueChange={onValueChange}
              placeholder={t('selectCompany.placeholder', {
                defaultValue: 'Select company to edit...',
              })}
              label={t('selectCompany.label', {
                defaultValue: 'Company',
              })}
              required={required}
              disabled={disabled}
            />
          </div>
        </div>
        {isEditMode && companyName && (
          <div className="mt-3 p-3 bg-blue-200 border border-blue-200 rounded-md dark:bg-blue-950 dark:border-blue-800">
            <p className="text-sm text-card-foreground">
              <span className="font-semibold">
                {t('selectCompany.editMode', {
                  defaultValue: 'Edit Mode:',
                })}
              </span>{' '}
              {companyName}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
