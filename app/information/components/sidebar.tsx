'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

interface SidebarProps {
  companyId?: string;
}

export function Sidebar(_props: SidebarProps = {}) {
  // companyId is accepted for backward compatibility with the /company/access
  // page which passes it; the sidebar UI does not currently depend on it.
  void _props;
  const { t } = useTranslation('company-information');

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('sidebar.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">📊</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('sidebar.completionRate')}
              </p>
              <p className="text-xs text-muted-foreground">{t('sidebar.completionRateValue')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">✅</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('sidebar.verifiedInfo')}
              </p>
              <p className="text-xs text-muted-foreground">{t('sidebar.verifiedInfoValue')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">⏱️</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('sidebar.lastUpdated')}
              </p>
              <p className="text-xs text-muted-foreground">{t('sidebar.lastUpdatedValue')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">📈</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('sidebar.progress')}
              </p>
              <p className="text-xs text-muted-foreground">{t('sidebar.progressValue')}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-white text-2xl">🏢</span>
            </div>
            <p className="text-sm text-foreground font-medium">
              {t('sidebar.companyProfile')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
