'use client';

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
import { GeneralInformationForm, Sidebar } from '../information/components';

// Read-only view of a company. Reuses the edit page's form forced into its
// read-only mode (isReadOnly) — the form already hides the Update button and
// freezes every sub-grid's add/edit/delete affordances.
export function CompanyViewContent() {
  const { t } = useTranslation('company-information');
  const { selectedCompanyId } = useCompanyContext();

  return (
    <div className="space-y-5 lg:space-y-7.5">
      {/* Page title Card — neutral; this is an intentional read-only view (not an
          access restriction), so no red view-only banner. */}
      <div className="[&_div.rounded-xl.bg-card.bg-card]:border-black! dark:[&_div.rounded-xl.bg-card.bg-card]:border-white!">
        <Card className="bg-blue-50! dark:bg-blue-950/25! shadow-lg shadow-black/5">
          <CardContent className="py-5">
            <Toolbar>
              <ToolbarHeading>
                <ToolbarPageTitle
                  text={t('toolbar.viewTitle', { defaultValue: 'View Company' })}
                />
                <ToolbarDescription>
                  {t('toolbar.viewDescription', {
                    defaultValue: 'View company information',
                  })}
                </ToolbarDescription>
              </ToolbarHeading>
              <ToolbarActions>
                <GuideLinkButton href="/view-guide" />
              </ToolbarActions>
            </Toolbar>
          </CardContent>
        </Card>
      </div>

      {/* Neutral glass tint on every section Card via descendant selector. */}
      <div
        className={
          '[&_div.rounded-xl.bg-card]:bg-blue-50! ' +
          '[&_div.rounded-xl.bg-card]:border-blue-100! ' +
          'dark:[&_div.rounded-xl.bg-card]:bg-blue-950/25! ' +
          'dark:[&_div.rounded-xl.bg-card]:border-blue-900! ' +
          '[&_div.rounded-xl.bg-card]:shadow-lg ' +
          '[&_div.rounded-xl.bg-card]:shadow-black/5 ' +
          '[&_tr:has(td):hover]:bg-blue-100! ' +
          'dark:[&_tr:has(td):hover]:bg-muted/50! ' +
          '[&_.text-muted-foreground]:text-card-foreground! ' +
          '[&_[data-slot="table-head"]]:text-muted-foreground! ' +
          '[&_.text-sm.text-muted-foreground.text-center]:text-muted-foreground! ' +
          '[&_[data-slot="card-description"]]:text-muted-foreground!'
        }
      >
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 lg:gap-7.5">
          <div className={selectedCompanyId ? 'col-span-3' : 'col-span-4'}>
            <div className="grid gap-5 lg:gap-7.5">
              <GeneralInformationForm isReadOnly={true} />
            </div>
          </div>
          {/* Sidebar (cardex) only makes sense once a company is selected. */}
          {selectedCompanyId && (
            <div className="col-span-1">
              <div className="grid gap-5 lg:gap-7.5">
                <Sidebar />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
