'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from '@/hooks/useTranslation';
import { PersonSearch, type PersonSearchResult } from '@/components/common/person-search';
import { formatDateTime } from '@/app/components/person/components/format-utils';

const LEVEL_NONE = 0;
const LEVEL_VIEW = 1;
const LEVEL_EDIT = 2;
const FA_LANGUAGE_ID = 12;
const EN_LANGUAGE_ID = 10;

interface AccessGrantSummary {
  companyId: string;
  grantedToPersonId: string;
  informationLevel: number;
  accessLevel: number;
  createdAt: string;
  updatedAt: string | null;
}

interface PersonLite {
  id: string;
  nationalId: string;
  translations: Array<{ languageId: number; firstName: string; lastName: string }>;
}

/**
 * A display-ready access-grant row. Mirrors how the other page sections (e.g.
 * EmailsGrid) take their rows as a prop with the display text baked in — so a
 * controlled caller doesn't need the person directory to resolve names.
 */
export interface AccessGrantRow {
  grantedToPersonId: string;
  personDisplay: string;
  informationLevel: number;
  accessLevel: number;
  createdAt: string;
  updatedAt: string | null;
}

interface AccessManagementSectionProps {
  companyId?: string;
  onReadOnlyChange?: (isReadOnly: boolean) => void;
  /**
   * When provided, the section is *controlled* (like the other page sections):
   * it renders these rows instead of fetching from the API, and all write
   * actions are hidden. Omit on the real page to keep the self-fetching
   * behavior unchanged.
   */
  rows?: AccessGrantRow[];
  /** Force read-only — hide add/edit/delete even when self-fetching. */
  readOnly?: boolean;
}

type LevelKey = 'information' | 'access';

export function AccessManagementSection({ companyId, onReadOnlyChange, rows, readOnly = false }: AccessManagementSectionProps) {
  const { t, i18n } = useTranslation('company-access');
  const queryClient = useQueryClient();
  const uiLangId = i18n.language === 'fa' ? FA_LANGUAGE_ID : EN_LANGUAGE_ID;
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US';

  // Controlled mode: caller supplied rows → never fetch, always read-only.
  const controlled = rows !== undefined;

  // Caller's own access on this company — used to lock down the page when
  // the caller is not the owner (or has only view on the access section).
  const { data: myLevels } = useQuery<{ information: number; access: number }>({
    queryKey: ['company-access-my-levels', companyId],
    queryFn: async () => {
      if (!companyId) return { information: 0, access: 0 };
      const res = await fetch(`/api/company/access/my-levels/${companyId}`);
      if (!res.ok) return { information: 0, access: 0 };
      return res.json();
    },
    enabled: !controlled && !!companyId,
  });
  const accessGrantsLevel = myLevels?.access ?? 0;
  const canEdit = !readOnly && !controlled && accessGrantsLevel >= LEVEL_EDIT;

  // Banner only for view-only state (level === 1). For no-access (level === 0)
  // the user shouldn't see the banner at all — the section just renders empty.
  useEffect(() => {
    onReadOnlyChange?.(!!companyId && accessGrantsLevel === LEVEL_VIEW);
  }, [companyId, accessGrantsLevel, onReadOnlyChange]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonSearchResult | null>(null);
  const [levels, setLevels] = useState<Record<LevelKey, number>>({
    information: LEVEL_NONE,
    access: LEVEL_NONE,
  });

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    toast.custom(
      () => (
        <Alert variant="mono" icon={type === 'success' ? 'success' : 'destructive'}>
          <AlertIcon>
            {type === 'success' ? <RiCheckboxCircleFill /> : <RiErrorWarningFill />}
          </AlertIcon>
          <AlertTitle>{message}</AlertTitle>
        </Alert>
      ),
      { position: 'top-center' },
    );
  }, []);

  // Pull existing grants for this company.
  const { data: grants = [] } = useQuery<AccessGrantSummary[]>({
    queryKey: ['company-access', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await fetch(`/api/company/access?companyId=${companyId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to load access grants');
      }
      return res.json();
    },
    enabled: !controlled && !!companyId,
  });

  // Pull person directory once so we can render names for the grant list.
  const { data: peopleDirectory = [] } = useQuery<PersonLite[]>({
    queryKey: ['person-directory-for-access'],
    queryFn: async () => {
      const res = await fetch('/api/person/directory?query=&limit=1000');
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    },
    enabled: !controlled && !!companyId,
  });

  const peopleById = useMemo(() => {
    const map = new Map<string, PersonLite>();
    for (const p of peopleDirectory) map.set(p.id, p);
    return map;
  }, [peopleDirectory]);

  const getPersonDisplay = useCallback((id: string): string => {
    const p = peopleById.get(id);
    if (!p) return id;
    const tr = p.translations?.find((tt) => tt.languageId === uiLangId) || p.translations?.[0];
    const name = tr ? `${tr.firstName} ${tr.lastName}`.trim() : '';
    return name ? `${name}${p.nationalId ? ` (${p.nationalId})` : ''}` : p.nationalId || id;
  }, [peopleById, uiLangId]);

  // Reset dialog state when it closes so the next open starts fresh.
  useEffect(() => {
    if (!dialogOpen) {
      setEditingPersonId(null);
      setSelectedPerson(null);
      setLevels({ information: LEVEL_NONE, access: LEVEL_NONE });
    }
  }, [dialogOpen]);

  const handleOpenAdd = useCallback(() => {
    setEditingPersonId(null);
    setSelectedPerson(null);
    setLevels({ information: LEVEL_NONE, access: LEVEL_NONE });
    setDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((g: AccessGrantRow) => {
    setEditingPersonId(g.grantedToPersonId);
    const lookup = peopleById.get(g.grantedToPersonId);
    if (lookup) {
      setSelectedPerson({
        id: lookup.id,
        nationalId: lookup.nationalId,
        translations: lookup.translations,
      } as PersonSearchResult);
    } else {
      setSelectedPerson(null);
    }
    setLevels({
      information: g.informationLevel,
      access: g.accessLevel,
    });
    setDialogOpen(true);
  }, [peopleById]);

  const grantMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('companyId missing');
      const granteeId = editingPersonId || selectedPerson?.id;
      if (!granteeId) throw new Error('Pick a person');
      const res = await fetch('/api/company/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          grantedToPersonId: granteeId,
          informationLevel: levels.information,
          accessLevel: levels.access,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to grant access');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-access', companyId] });
      setDialogOpen(false);
      showToast(t('accessGranted'), 'success');
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (grantedToPersonId: string) => {
      if (!companyId) throw new Error('companyId missing');
      const res = await fetch(
        `/api/company/access/by-pair/${companyId}/${grantedToPersonId}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to revoke access');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-access', companyId] });
      showToast(t('accessRevoked'), 'success');
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  if (!companyId && !controlled) return null;

  // Unified rows: controlled rows as-is, otherwise the fetched grants mapped to
  // display rows (person name resolved from the directory).
  const displayRows: AccessGrantRow[] = controlled
    ? rows!
    : grants.map((g) => ({
        grantedToPersonId: g.grantedToPersonId,
        personDisplay: getPersonDisplay(g.grantedToPersonId),
        informationLevel: g.informationLevel,
        accessLevel: g.accessLevel,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      }));

  // Render helpers ─────────────────────────────────────────────────────────
  const renderLevelBadge = (level: number) => {
    if (level === LEVEL_EDIT) return <Badge variant="primary">{t('levelEdit')}</Badge>;
    if (level === LEVEL_VIEW) return <Badge variant="secondary">{t('levelView')}</Badge>;
    return <Badge variant="outline">{t('levelNone')}</Badge>;
  };

  const renderLevelSelect = (key: LevelKey, label: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={String(levels[key])}
        onValueChange={(v) => setLevels((prev) => ({ ...prev, [key]: Number(v) }))}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={String(LEVEL_NONE)}>{t('levelNone')}</SelectItem>
          <SelectItem value={String(LEVEL_VIEW)}>{t('levelView')}</SelectItem>
          <SelectItem value={String(LEVEL_EDIT)}>{t('levelEdit')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">1</span>
          {t('accessManagement')}
          <Badge variant="outline">{displayRows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <fieldset disabled={!canEdit} className="space-y-4 contents">
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={handleOpenAdd}>
                  <Plus className="h-4 w-4 ml-1" />
                  {t('add')}
                </Button>
              </div>
            )}

            {displayRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('noAccessGrantsYet')}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>{t('person-search:label', { defaultValue: 'Person' })}</TableHead>
                    <TableHead>{t('sectionInformation')}</TableHead>
                    <TableHead>{t('sectionAccess')}</TableHead>
                    <TableHead>{t('common:createdAt', { defaultValue: 'Created At' })}</TableHead>
                    <TableHead>{t('common:updatedAt', { defaultValue: 'Last Modified' })}</TableHead>
                    <TableHead className="w-20">{t('common:actions', { defaultValue: 'Actions' })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((g, idx) => (
                    <TableRow key={g.grantedToPersonId}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{g.personDisplay}</TableCell>
                      <TableCell>{renderLevelBadge(g.informationLevel)}</TableCell>
                      <TableCell>{renderLevelBadge(g.accessLevel)}</TableCell>
                      <TableCell style={{ unicodeBidi: 'plaintext' }}>{formatDateTime(g.createdAt, locale)}</TableCell>
                      <TableCell style={{ unicodeBidi: 'plaintext' }}>{formatDateTime(g.updatedAt, locale)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenEdit(g)}
                                aria-label={t('editGrant')}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => revokeMutation.mutate(g.grantedToPersonId)}
                                disabled={revokeMutation.status === 'pending'}
                                aria-label={t('removeAccess')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </fieldset>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg border-white! dark:border-white!">
            <DialogHeader>
              <DialogTitle>
                {editingPersonId ? t('editGrant') : t('addAccess')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* When editing an existing grant, the grantee is fixed —
                  show their name read-only instead of re-rendering the search. */}
              {editingPersonId ? (
                <div className="space-y-2">
                  <Label>{t('person-search:label', { defaultValue: 'Person' })}</Label>
                  <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                    {getPersonDisplay(editingPersonId)}
                  </div>
                </div>
              ) : (
                <PersonSearch
                  onSelect={(p) => setSelectedPerson(p)}
                  value={selectedPerson}
                  label={t('person-search:label', { defaultValue: 'Person' })}
                  apiUrl="/api/person/directory"
                />
              )}
              {renderLevelSelect('information', t('sectionInformation'))}
              {renderLevelSelect('access', t('sectionAccess'))}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t('common:cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                type="button"
                onClick={() => grantMutation.mutate()}
                disabled={
                  (!editingPersonId && !selectedPerson) || grantMutation.status === 'pending'
                }
              >
                {t('common:save', { defaultValue: 'Save' })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
