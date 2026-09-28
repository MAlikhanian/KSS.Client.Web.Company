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
import { translateApiError } from '@/lib/format-utils';
import type { Role } from '@/services/auth-api';
import { formatDateTime } from '@/app/components/person/components/format-utils';

const LEVEL_NONE = 0;
const LEVEL_VIEW = 1;
const LEVEL_EDIT = 2;
const FA_LANGUAGE_ID = 12;
const EN_LANGUAGE_ID = 10;

interface RoleAccessGrantSummary {
  companyId: string | null;
  grantedToRoleId: string;
  informationLevel: number;
  accessLevel: number;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * A display-ready role-access row — role name + scope baked in, so a controlled
 * caller doesn't need the role catalog to resolve names (mirrors the other page
 * sections that take their rows as a prop).
 */
export interface RoleAccessRow {
  grantedToRoleId: string;
  roleDisplay: string;
  companyId: string | null;
  informationLevel: number;
  accessLevel: number;
  createdAt: string;
  updatedAt: string | null;
}

interface RoleAccessManagementSectionProps {
  companyId?: string;
  canEdit?: boolean;
  /**
   * When provided, the section is *controlled* (like the other page sections):
   * it renders these rows instead of fetching from the API, and all write
   * actions are hidden. Omit on the real page to keep the self-fetching
   * behavior unchanged.
   */
  rows?: RoleAccessRow[];
  /** Force read-only — hide add/edit/delete even when self-fetching. */
  readOnly?: boolean;
}

type LevelKey = 'information' | 'access';
type ScopeKey = 'company' | 'global';

export function RoleAccessManagementSection({ companyId, canEdit = false, rows, readOnly = false }: RoleAccessManagementSectionProps) {
  const { t, i18n } = useTranslation('company-access');
  const queryClient = useQueryClient();
  const uiLangId = i18n.language === 'fa' ? FA_LANGUAGE_ID : EN_LANGUAGE_ID;
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US';

  // Controlled mode: caller supplied rows → never fetch, always read-only.
  const controlled = rows !== undefined;
  const writable = !readOnly && !controlled && canEdit;

  const [dialogOpen, setDialogOpen] = useState(false);
  // When non-null, dialog is in edit mode for this (companyId|null, roleId) pair.
  const [editingPair, setEditingPair] = useState<{
    companyId: string | null;
    roleId: string;
  } | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [scope, setScope] = useState<ScopeKey>('company');
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

  // Per-company + global role grants visible on this company's access page.
  const { data: grants = [] } = useQuery<RoleAccessGrantSummary[]>({
    queryKey: ['company-role-access', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await fetch(`/api/company/role-access/by-company/${companyId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to load role access grants');
      }
      return res.json();
    },
    enabled: !controlled && !!companyId,
  });

  // Full role catalog (id + code + translations) for the role picker and labels.
  const { data: allRoles = [] } = useQuery<Role[]>({
    queryKey: ['auth-roles-all'],
    queryFn: async () => {
      const res = await fetch('/api/auth/role/all');
      if (!res.ok) return [];
      const json = await res.json().catch(() => []);
      return Array.isArray(json) ? (json as Role[]) : [];
    },
    enabled: !controlled,
  });

  const rolesById = useMemo(() => {
    const map = new Map<string, Role>();
    for (const r of allRoles) map.set(r.id, r);
    return map;
  }, [allRoles]);

  const getRoleDisplay = useCallback(
    (id: string): string => {
      const r = rolesById.get(id);
      if (!r) return id;
      const tr = r.translations?.find((tt) => tt.languageId === uiLangId) || r.translations?.[0];
      return tr?.name || r.code;
    },
    [rolesById, uiLangId],
  );

  // Reset dialog state when it closes so the next open starts fresh.
  useEffect(() => {
    if (!dialogOpen) {
      setEditingPair(null);
      setSelectedRoleId('');
      setScope('company');
      setLevels({ information: LEVEL_NONE, access: LEVEL_NONE });
    }
  }, [dialogOpen]);

  const handleOpenAdd = useCallback(() => {
    setEditingPair(null);
    setSelectedRoleId('');
    setScope('company');
    setLevels({ information: LEVEL_NONE, access: LEVEL_NONE });
    setDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((g: RoleAccessRow) => {
    setEditingPair({ companyId: g.companyId, roleId: g.grantedToRoleId });
    setSelectedRoleId(g.grantedToRoleId);
    setScope(g.companyId === null ? 'global' : 'company');
    setLevels({
      information: g.informationLevel,
      access: g.accessLevel,
    });
    setDialogOpen(true);
  }, []);

  const grantMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('companyId missing');
      const roleId = editingPair?.roleId || selectedRoleId;
      if (!roleId) throw new Error('Pick a role');
      // Editing keeps the original scope; adding uses the form's scope toggle.
      const targetCompanyId = editingPair
        ? editingPair.companyId
        : scope === 'global'
          ? null
          : companyId;
      const res = await fetch('/api/company/role-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: targetCompanyId,
          grantedToRoleId: roleId,
          informationLevel: levels.information,
          accessLevel: levels.access,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to grant role access');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-role-access', companyId] });
      setDialogOpen(false);
      showToast(t('roleAccessGranted'), 'success');
    },
    onError: (err: Error) => {
      showToast(translateApiError(err.message, t), 'error');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (g: RoleAccessRow) => {
      const params = new URLSearchParams({ grantedToRoleId: g.grantedToRoleId });
      if (g.companyId) params.set('companyId', g.companyId);
      const res = await fetch(`/api/company/role-access/by-pair?${params.toString()}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to revoke role access');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-role-access', companyId] });
      showToast(t('roleAccessRevoked'), 'success');
    },
    onError: (err: Error) => {
      showToast(translateApiError(err.message, t), 'error');
    },
  });

  // Roles already granted (per current scope) — hide them in the picker so the
  // user can't accidentally try to re-add a duplicate.
  const usedRoleIdsForScope = useMemo(() => {
    const set = new Set<string>();
    for (const g of grants) {
      const isGlobalRow = g.companyId === null;
      if ((scope === 'global' && isGlobalRow) || (scope === 'company' && !isGlobalRow)) {
        set.add(g.grantedToRoleId);
      }
    }
    return set;
  }, [grants, scope]);

  const availableRolesForPicker = useMemo(
    () =>
      allRoles.filter((r) => editingPair?.roleId === r.id || !usedRoleIdsForScope.has(r.id)),
    [allRoles, usedRoleIdsForScope, editingPair],
  );

  if (!companyId && !controlled) return null;

  // Unified rows: controlled rows as-is, otherwise the fetched grants mapped to
  // display rows (role name resolved from the catalog).
  const displayRows: RoleAccessRow[] = controlled
    ? rows!
    : grants.map((g) => ({
        grantedToRoleId: g.grantedToRoleId,
        roleDisplay: getRoleDisplay(g.grantedToRoleId),
        companyId: g.companyId,
        informationLevel: g.informationLevel,
        accessLevel: g.accessLevel,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      }));

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
          <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">2</span>
          {t('roleAccessManagement')}
          <Badge variant="outline">{displayRows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <fieldset disabled={!writable} className="space-y-4 contents">
          <div className="space-y-4">
            {writable && (
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={handleOpenAdd}>
                  <Plus className="h-4 w-4 ml-1" />
                  {t('add')}
                </Button>
              </div>
            )}

            {displayRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('noRoleGrantsYet')}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>{t('selectRole')}</TableHead>
                    <TableHead>{t('scope')}</TableHead>
                    <TableHead>{t('sectionInformation')}</TableHead>
                    <TableHead>{t('sectionAccess')}</TableHead>
                    <TableHead>{t('common:createdAt', { defaultValue: 'Created At' })}</TableHead>
                    <TableHead>{t('common:updatedAt', { defaultValue: 'Last Modified' })}</TableHead>
                    <TableHead className="w-20">{t('common:actions', { defaultValue: 'Actions' })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((g, idx) => (
                    <TableRow key={`${g.companyId ?? 'global'}-${g.grantedToRoleId}`}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{g.roleDisplay}</TableCell>
                      <TableCell>
                        {g.companyId === null ? (
                          <Badge variant="primary">{t('globalScopeBadge')}</Badge>
                        ) : (
                          <Badge variant="outline">{t('companyScopeBadge')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{renderLevelBadge(g.informationLevel)}</TableCell>
                      <TableCell>{renderLevelBadge(g.accessLevel)}</TableCell>
                      <TableCell style={{ unicodeBidi: 'plaintext' }}>{formatDateTime(g.createdAt, locale)}</TableCell>
                      <TableCell style={{ unicodeBidi: 'plaintext' }}>{formatDateTime(g.updatedAt, locale)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {writable && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenEdit(g)}
                                aria-label={t('editRoleGrant')}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => revokeMutation.mutate(g)}
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
                {editingPair ? t('editRoleGrant') : t('addRoleAccess')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {editingPair ? (
                <div className="space-y-2">
                  <Label>{t('selectRole')}</Label>
                  <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                    {getRoleDisplay(editingPair.roleId)}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t('selectRole')}</Label>
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRolesForPicker.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {getRoleDisplay(r.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Scope toggle is only meaningful when adding — when editing, the
                  scope is locked to the original row's CompanyId|null. */}
              {!editingPair && (
                <div className="space-y-2">
                  <Label>{t('scope')}</Label>
                  <Select value={scope} onValueChange={(v) => setScope(v as ScopeKey)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">{t('scopeCompany')}</SelectItem>
                      <SelectItem value="global">{t('scopeGlobal')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  (!editingPair && !selectedRoleId) || grantMutation.status === 'pending'
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
