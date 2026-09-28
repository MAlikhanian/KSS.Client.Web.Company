'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { RiErrorWarningFill } from '@remixicon/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useTranslation } from '@/hooks/useTranslation';
import { SectionHelp, GUIDE_TINT } from '../components/guide-ui';
import { Sidebar } from '../information/components';
import {
  CompanyInformationSection,
  RegistrationLegalSection,
  EmailsGrid,
  PhonesGrid,
  AddressesGrid,
  NameHistoryGrid,
  StakeholdersGrid,
} from '@/components/common/company-info';
import {
  SAMPLE_COMPANY_NAME,
  sampleNameHistory,
  sampleRegistration,
  sampleEmails,
  samplePhones,
  sampleAddresses,
  sampleStakeholders,
} from '../information-guide/sample-data';

const NS = 'company-view-guide';

export function CompanyViewGuideContent() {
  const { t } = useTranslation(NS);
  const { t: tCI } = useTranslation('company-information');
  const noop = () => {};

  const quickStepsRaw = t('quickStart.steps', { returnObjects: true }) as unknown;
  const quickSteps = Array.isArray(quickStepsRaw) ? (quickStepsRaw as string[]) : [];
  const faqRaw = t('faq.items', { returnObjects: true }) as unknown;
  const faq = Array.isArray(faqRaw) ? (faqRaw as { q: string; a: string }[]) : [];

  return (
    <div className="space-y-5 lg:space-y-7.5">
      {/* Title card */}
      <Card className="bg-violet-50! dark:bg-violet-950/25! shadow-lg shadow-black/5">
        <CardContent className="py-5">
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text={t('title')} />
              <ToolbarDescription>{t('subtitle')}</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <Button asChild>
                <Link href="/view">
                  <ChevronRight className="h-4 w-4" />
                  {t('entry.backToPage')}
                </Link>
              </Button>
            </ToolbarActions>
          </Toolbar>
        </CardContent>
      </Card>

      {/* Training banner */}
      <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 flex items-start gap-3 shadow-sm">
        <RiErrorWarningFill className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <span className="text-sm font-medium text-amber-900 dark:text-amber-200 leading-7">
          {t('demoBanner')}
        </span>
      </div>

      <div className={GUIDE_TINT}>
        <div className="space-y-5 lg:space-y-7.5">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('quickStart.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground leading-7">{t('quickStart.intro')}</p>
              <ol className="list-decimal pr-5 space-y-1 text-sm leading-7">
                {quickSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Selection (static read-only representation) */}
          <SectionHelp ns={NS} skey="selection" color="neutral" num="●" />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {t('sections.selection.title')}
                <Badge variant="secondary">{t('labels.demoData')}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-md">
                <Label>{tCI('selectCompany.label', { defaultValue: 'Company' })}</Label>
                <Input value={SAMPLE_COMPANY_NAME} dir="rtl" disabled readOnly />
                <div className="pt-1">
                  <Badge variant="primary">
                    {tCI('selectCompany.editMode', { defaultValue: 'Edit Mode:' })} {SAMPLE_COMPANY_NAME}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 1) Name history */}
          <SectionHelp ns={NS} skey="nameHistory" color="sky" num="۱" />
          <CompanyInformationSection titleKey="form.sections.nameHistory">
            <NameHistoryGrid
              nameHistory={sampleNameHistory}
              onAdd={noop}
              onEdit={noop}
              onDelete={noop}
              onDeleteTranslation={noop}
              disabled
              readOnly
            />
          </CompanyInformationSection>

          {/* 2) Registration & legal */}
          <SectionHelp ns={NS} skey="registrationLegal" color="indigo" num="۲" />
          <RegistrationLegalSection formData={sampleRegistration} onInputChange={noop} disabled />

          {/* 3) Emails */}
          <SectionHelp ns={NS} skey="emails" color="teal" num="۳" />
          <EmailsGrid emails={sampleEmails} onAdd={noop} onEdit={noop} onDelete={noop} disabled readOnly />

          {/* 4) Phones */}
          <SectionHelp ns={NS} skey="phones" color="cyan" num="۴" />
          <PhonesGrid phones={samplePhones} onAdd={noop} onEdit={noop} onDelete={noop} disabled readOnly />

          {/* 5) Addresses */}
          <SectionHelp ns={NS} skey="addresses" color="slate" num="۵" />
          <AddressesGrid
            addresses={sampleAddresses}
            onAdd={noop}
            onEdit={noop}
            onDelete={noop}
            disabled
            readOnly
          />

          {/* 6) Stakeholders */}
          <SectionHelp ns={NS} skey="stakeholders" color="emerald" num="۶" />
          <StakeholdersGrid
            stakeholders={sampleStakeholders}
            onAdd={noop}
            onEdit={noop}
            onDelete={noop}
            disabled
            readOnly
          />

          {/* Cardex / sidebar */}
          <SectionHelp ns={NS} skey="sidebar" color="violet" num="≡" />
          <div className="max-w-md">
            <Sidebar />
          </div>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>{t('faq.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {faq.map((item, i) => (
                <details key={i} className="rounded-lg border border-border/60 bg-background/40 p-3">
                  <summary className="cursor-pointer font-medium text-sm">{item.q}</summary>
                  <p className="text-sm text-muted-foreground leading-7 mt-2">{item.a}</p>
                </details>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
