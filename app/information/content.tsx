'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RiInformationFill } from '@remixicon/react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useTranslation } from '@/hooks/useTranslation';
import { GuideLinkButton } from '../components/guide-link-button';
import { useCompanyContext } from '../contexts/company-context';
import { GeneralInformationForm } from './components';

export function CompanyInformationContent() {
  const { t } = useTranslation('company-information');
  const { selectedCompanyId } = useCompanyContext();
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Caller's own access level on this company (Information section). Level 1 =
  // view-only — page flips the title card to a red view-only banner and the
  // form disables write actions. Level 0 means the backend already returns 404
  // for direct GETs and the form's load handler clears the selection.
  const { data: myLevels } = useQuery<{ information: number; access: number }>({
    queryKey: ['company-information-my-levels', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return { information: 0, access: 0 };
      const res = await fetch(`/api/company/access/my-levels/${selectedCompanyId}`);
      if (!res.ok) return { information: 0, access: 0 };
      return res.json();
    },
    enabled: !!selectedCompanyId,
  });

  useEffect(() => {
    setIsReadOnly(!!selectedCompanyId && (myLevels?.information ?? 0) === 1);
  }, [selectedCompanyId, myLevels]);

  return (
    <div className="space-y-5 lg:space-y-7.5">
      {/*
        Title Card lives OUTSIDE the descendant-tint wrapper below so its
        color override actually wins (descendant selectors beat Card-level
        classes on specificity even with `!`). Default is neutral; on
        view-only the title flips to red and the access-denied message
        appears below the description.
      */}
      {/* Page title Card — neutral bg always; border flips to red on view-only.
          Doubled .bg-card.bg-card on the wrapper beats the Card's own border
          on specificity, so the red wins. */}
      <div
        className={
          isReadOnly
            ? '[&_div.rounded-xl.bg-card.bg-card]:border-red-500! dark:[&_div.rounded-xl.bg-card.bg-card]:border-red-500!'
            : '[&_div.rounded-xl.bg-card.bg-card]:border-black! dark:[&_div.rounded-xl.bg-card.bg-card]:border-white!'
        }
      >
        <Card className="bg-blue-50! dark:bg-blue-950/25! shadow-lg shadow-black/5">
          <CardContent className="py-5">
            <Toolbar>
              <ToolbarHeading>
                <ToolbarPageTitle
                  text={t('toolbar.title', { defaultValue: 'Company Information' })}
                />
                <ToolbarDescription>
                  {t('toolbar.description', {
                    defaultValue: 'General Company Information Management',
                  })}
                </ToolbarDescription>
              </ToolbarHeading>
              <ToolbarActions>
                <GuideLinkButton href="/information-guide" />
              </ToolbarActions>
            </Toolbar>
            {isReadOnly && (
              <div className="mt-3 flex items-center gap-3">
                <RiInformationFill className="text-red-700 dark:text-red-400 size-5 shrink-0" />
                <span className="text-red-900 dark:text-red-200 font-medium">
                  {t('informationViewOnlyBanner', {
                    defaultValue: 'You have view-only access to company information',
                  })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/*
        Neutral glass tint on every section Card via descendant selector.
      */}
      <div
        className={
          // Neutral tint on every section Card via descendant selector.
          '[&_div.rounded-xl.bg-card]:bg-blue-50! ' +
          '[&_div.rounded-xl.bg-card]:border-blue-100! ' +
          'dark:[&_div.rounded-xl.bg-card]:bg-blue-950/25! ' +
          'dark:[&_div.rounded-xl.bg-card]:border-blue-900! ' +
          '[&_div.rounded-xl.bg-card]:shadow-lg ' +
          '[&_div.rounded-xl.bg-card]:shadow-black/5 ' +
          // Light-theme row hover: TableRow defaults to bg-muted/50, which is invisible
          // against bg-blue-50. Use blue-100 in light; keep the original in dark.
          '[&_tr:has(td):hover]:bg-blue-100! ' +
          'dark:[&_tr:has(td):hover]:bg-muted/50! ' +
          // Force all subdued text to use card-foreground (readable in both themes).
          '[&_.text-muted-foreground]:text-card-foreground! ' +
          // Restore original muted color on column headers (both themes).
          '[&_[data-slot="table-head"]]:text-muted-foreground! ' +
          // Restore original muted color on empty-state messages (both themes).
          '[&_.text-sm.text-muted-foreground.text-center]:text-muted-foreground! ' +
          // Restore original muted color on CardDescription (both themes).
          '[&_[data-slot="card-description"]]:text-muted-foreground!'
        }
      >
        <div className="grid gap-5 lg:gap-7.5">
          <GeneralInformationForm isReadOnly={isReadOnly} />
        </div>
      </div>
    </div>
  );
}
