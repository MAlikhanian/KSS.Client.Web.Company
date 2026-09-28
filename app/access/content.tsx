'use client';

import { useEffect, useState } from 'react';
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
import { CompanySelectionCard } from '../components/company-selection-card';
import { useCompanyContext } from '../contexts/company-context';
import { AccessManagementSection } from './components/access-management-section';
import { RoleAccessManagementSection } from './components/role-access-management-section';

export function CompanyAccessContent() {
  const { t } = useTranslation('company-access');
  // Shared with /company/information via CompanyProvider (persists in localStorage).
  const { selectedCompanyId: companyId, setSelectedCompanyId } = useCompanyContext();
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Reuse the same access-section level the AccessManagementSection consults so
  // both sections are gated by the caller's Edit on the Access section.
  const { data: myLevels } = useQuery<{ access: number }>({
    queryKey: ['company-access-my-levels', companyId],
    queryFn: async () => {
      if (!companyId) return { access: 0 };
      const res = await fetch(`/api/company/access/my-levels/${companyId}`);
      if (!res.ok) return { access: 0 };
      return res.json();
    },
    enabled: !!companyId,
  });
  const canEditRoleAccess = (myLevels?.access ?? 0) >= 2;

  // Stale-selection guard: if the persisted companyId points to a company the
  // caller no longer has any access on (revoked while away), drop it so the
  // page resets to an empty selector instead of firing a grants fetch that
  // returns a 400 "no permission" toast.
  useEffect(() => {
    if (companyId && myLevels !== undefined && myLevels.access === 0) {
      setSelectedCompanyId('');
    }
  }, [companyId, myLevels, setSelectedCompanyId]);

  return (
    <div className="space-y-5 lg:space-y-7.5">
      {/*
        Title Card lives OUTSIDE the descendant-tint wrapper below so its
        color override actually wins (descendant selectors beat Card-level
        classes on specificity even with `!`). Default theme is light blue;
        on view-only the title flips to red and the access-denied message
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
                text={t('companyAccessPageTitle', { defaultValue: 'Company Access Management' })}
              />
              <ToolbarDescription>
                {t('accessManagementDescription', {
                  defaultValue: 'Grant other persons view or edit access to a selected company',
                })}
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <GuideLinkButton href="/access-guide" />
            </ToolbarActions>
          </Toolbar>
          {isReadOnly && (
            <div className="mt-3 flex items-center gap-3">
              <RiInformationFill className="text-red-700 dark:text-red-400 size-5 shrink-0" />
              <span className="text-red-900 dark:text-red-200 font-medium">
                {t('accessViewOnlyBanner', {
                  defaultValue: 'You have view-only access to access management',
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/*
        Light blue glass tint on every section Card via descendant selector.
      */}
      <div
        className={
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
          <div>
            <div className="grid gap-5 lg:gap-7.5">
              {/* Company Selection Card — white border override (doubled .bg-card beats the page's blue border tint on specificity) */}
              <div
                className={
                  '[&_div.rounded-xl.bg-card.bg-card]:border-black! ' +
                  'dark:[&_div.rounded-xl.bg-card.bg-card]:border-white!'
                }
              >
                <CompanySelectionCard
                  value={companyId}
                  onValueChange={setSelectedCompanyId}
                  isEditMode={!!companyId}
                />
              </div>

              {/* Section 1 — sky border to match badge */}
              {companyId && (
                <div className="[&_div.rounded-xl.bg-card.bg-card]:border-sky-500! dark:[&_div.rounded-xl.bg-card.bg-card]:border-sky-500!">
                  <AccessManagementSection
                    companyId={companyId}
                    onReadOnlyChange={setIsReadOnly}
                  />
                </div>
              )}

              {/* Section 2 — indigo border to match badge */}
              {companyId && (
                <div className="[&_div.rounded-xl.bg-card.bg-card]:border-indigo-500! dark:[&_div.rounded-xl.bg-card.bg-card]:border-indigo-500!">
                  <RoleAccessManagementSection
                    companyId={companyId}
                    canEdit={canEditRoleAccess}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
