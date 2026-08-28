'use client';

import Link from 'next/link';
import { ChevronRight, Save } from 'lucide-react';
import { RiErrorWarningFill, RiInformationFill } from '@remixicon/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useTranslation } from '@/hooks/useTranslation';
import { SectionHelp, GUIDE_TINT } from '../components/guide-ui';
import { BasicInformationSection } from '../create/components/basic-information-section';
import { sampleBasicInfo } from './sample-data';

const NS = 'company-create-guide';

export function CompanyCreateGuideContent() {
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
                <Link href="/create">
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

          {/* 1) Basic information */}
          <SectionHelp ns={NS} skey="basicInfo" color="sky" num="۱" />
          <BasicInformationSection formData={sampleBasicInfo} onInputChange={noop} disabled />

          {/* Operations card (static, disabled) — mirrors the real create page. */}
          <SectionHelp ns={NS} skey="operations" color="violet" num="✓" />
          <Card>
            <CardHeader>
              <CardTitle>{tCI('form.sections.operations', { defaultValue: 'Operations' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-start gap-2">
                <RiInformationFill className="text-blue-600 dark:text-blue-400 size-5 shrink-0 mt-0.5" />
                <span className="text-sm text-card-foreground">
                  {tCI('form.messages.createInfo', {
                    defaultValue:
                      'After registering the company, you will be redirected to the edit page to complete the remaining information (contacts, stakeholders, etc.).',
                  })}
                </span>
              </div>
              <div className="flex justify-end">
                <Button type="button" disabled>
                  <Save className="h-4 w-4" />
                  {tCI('form.actions.create', { defaultValue: 'Create Company' })}
                </Button>
              </div>
            </CardContent>
          </Card>

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
