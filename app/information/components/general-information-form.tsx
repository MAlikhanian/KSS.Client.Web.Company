'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill, RiInformationFill } from '@remixicon/react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from '@/hooks/useTranslation';
import { useData } from '@/hooks/use-data';
import { translateApiError } from '@/lib/format-utils';
import {
  CompanyInformationSection,
  RegistrationLegalSection,
  NameHistoryGrid,
  EmailsGrid,
  PhonesGrid,
  AddressesGrid,
  StakeholdersGrid,
  DocumentsSection,
  WebsitesGrid,
  type StakeholderItem,
  type StakeholderUpsertPayload,
} from '@/components/common/company-info';
import { CompanySelectionCard, useCompanyContext } from '../../components';

interface GeneralInformationFormData {
  registrationDate: string;
  registrationNumber: string;
  registrationCountry: string;
  registrationRegion: string;
  registrationCity: string;
  nationalId: string;
  economicCode: string;
}

interface TranslationEntry {
  languageId: number;
  name: string;
}

interface NameHistoryItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description?: string;
  translations?: TranslationEntry[];
}

interface EmailItem {
  id: string;
  labelId: number;
  labelName: string;
  emailAddress: string;
  isPrimary: boolean;
  isVerified: boolean;
}

interface PhoneItem {
  id: string;
  labelId: number;
  labelName: string;
  countryId: number;
  phoneNumber: string;
  isPrimary: boolean;
  isVerified: boolean;
}

interface AddressItem {
  id: string;
  labelId: number;
  labelName: string;
  countryId: number;
  regionId: number;
  cityId: number;
  countryName?: string;
  regionName?: string;
  cityName?: string;
  postalCode: string;
  street1: string;
  street2: string | null;
  isPrimary: boolean;
  isVerified: boolean;
}

interface WebsiteItem {
  id: string;
  labelId: number;
  labelName: string;
  url: string;
  isPrimary: boolean;
}

const emptyFormData: GeneralInformationFormData = {
  registrationDate: '',
  registrationNumber: '',
  registrationCountry: '',
  registrationRegion: '',
  registrationCity: '',
  nationalId: '',
  economicCode: '',
};

interface GeneralInformationFormProps {
  /**
   * When true the caller has only view access (Information level 1) on the
   * selected company. The form disables the Update button and freezes all
   * sub-grid CRUD buttons — backend row-level check would 403 the writes
   * anyway, this just hides the affordance.
   */
  isReadOnly?: boolean;
}

export function GeneralInformationForm({ isReadOnly = false }: GeneralInformationFormProps) {
  const { t } = useTranslation('company-information');
  const queryClient = useQueryClient();
  const { selectedCompanyId, setSelectedCompanyId, isEditMode } = useCompanyContext();
  // Phone + address labels from the Common service (canonical lookup) — not hardcoded.
  const { data: phoneLabels } = useData('phone-labels');
  const phoneLabelOptions = phoneLabels.map((l) => ({ id: Number(l.id), name: l.name }));
  const { data: addressLabels } = useData('address-labels');
  const addressLabelOptions = addressLabels.map((l) => ({ id: Number(l.id), name: l.name }));
  const [formData, setFormData] = useState<GeneralInformationFormData>(emptyFormData);
  const [nameHistory, setNameHistory] = useState<NameHistoryItem[]>([]);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [phones, setPhones] = useState<PhoneItem[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [stakeholders, setStakeholders] = useState<StakeholderItem[]>([]);
  const [companyAudit, setCompanyAudit] = useState<{ createdAt?: string; updatedAt?: string | null }>({});

  // Shared toast helper — used by every grid CRUD handler below.
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

  // Reload contacts from GET endpoint (returns fully populated data with label/location names)
  const reloadContacts = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const contactResponse = await fetch(`/api/company/${selectedCompanyId}/contacts`);
      if (contactResponse.ok) {
        const contacts = await contactResponse.json();
        setEmails(contacts.emails || []);
        setPhones(contacts.phones || []);
        setAddresses(contacts.addresses || []);
        setWebsites(contacts.websites || []);
      }
    } catch (error) {
      console.error('Error reloading contacts:', error);
    }
  }, [selectedCompanyId]);

  // Reload stakeholders for the selected company.
  const reloadStakeholders = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const res = await fetch(`/api/company/${selectedCompanyId}/stakeholders`);
      if (res.ok) {
        const data = await res.json();
        setStakeholders(data || []);
      }
    } catch (error) {
      console.error('Error reloading stakeholders:', error);
    }
  }, [selectedCompanyId]);

  // Reload company data (to refresh nameHistory after CRUD)
  const reloadCompany = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}`);
      if (response.ok) {
        const company = await response.json();
        setNameHistory(company.nameHistory || []);
      }
    } catch (error) {
      console.error('Error reloading company:', error);
    }
  }, [selectedCompanyId]);

  // Load company data when selected
  useEffect(() => {
    const loadCompanyData = async () => {
      if (!selectedCompanyId) {
        setFormData(emptyFormData);
        setNameHistory([]);
        setEmails([]);
        setPhones([]);
        setAddresses([]);
        setWebsites([]);
        setStakeholders([]);
        setCompanyAudit({});
        return;
      }

      try {
        const response = await fetch(`/api/company/${selectedCompanyId}`);
        // 404 = caller has no row-level access to this company (or it no longer
        // exists). Clear the stale selection so the form resets and the
        // localStorage cache doesn't keep re-triggering this fetch.
        if (response.status === 404) {
          setSelectedCompanyId('');
          return;
        }
        if (!response.ok) throw new Error('Failed to load company data');
        const company = await response.json();
        if (company) {
          setFormData({
            registrationDate: company.registrationDate ? new Date(company.registrationDate).toISOString().split('T')[0] : '',
            registrationNumber: company.registrationNumber || '',
            registrationCountry: company.registrationCountry || '',
            registrationRegion: company.registrationRegion || '',
            registrationCity: company.registrationCity || '',
            nationalId: company.nationalId || '',
            economicCode: company.economicCode || '',
          });
          setNameHistory(company.nameHistory || []);
          setCompanyAudit({ createdAt: company.createdAt, updatedAt: company.updatedAt });
        }

        // Load contact data
        await reloadContacts();
        await reloadStakeholders();
      } catch (error) {
        console.error('Error loading company data:', error);
      }
    };

    loadCompanyData();
  }, [selectedCompanyId, reloadContacts, reloadStakeholders, setSelectedCompanyId]);

  const handleInputChange = (field: keyof GeneralInformationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Name History CRUD handlers
  const handleAddNameHistory = useCallback(async (data: { translations: TranslationEntry[]; startDate: string; endDate: string | null; description?: string }) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/name-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await reloadCompany();
        showToast(t('form.messages.created'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error adding name history:', error);
    }
  }, [selectedCompanyId, reloadCompany, showToast, t]);

  const handleEditNameHistory = useCallback(async (id: string, data: { translations: TranslationEntry[]; startDate: string; endDate: string | null; description?: string }) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/name-history`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, ...data }),
      });
      if (response.ok) {
        await reloadCompany();
        showToast(t('form.messages.updated'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error updating name history:', error);
    }
  }, [selectedCompanyId, reloadCompany, showToast, t]);

  const handleDeleteNameHistory = useCallback(async (id: string) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/name-history?itemId=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setNameHistory((prev) => prev.filter((item) => item.id !== id));
        await reloadCompany();
        showToast(t('form.messages.deleted'), 'success');
      } else {
        const data = await response.json().catch(() => null);
        showToast(translateApiError(data?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error deleting name history:', error);
    }
  }, [selectedCompanyId, reloadCompany, showToast, t]);

  const handleDeleteTranslation = useCallback(async (historyId: string, languageId: number, name: string) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/name-history`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: historyId, languageId, name }),
      });
      if (response.ok) {
        await reloadCompany();
        showToast(t('form.messages.deleted'), 'success');
      } else {
        const data = await response.json().catch(() => null);
        showToast(translateApiError(data?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error deleting translation:', error);
    }
  }, [selectedCompanyId, reloadCompany, showToast, t]);

  // Contact CRUD handlers
  const handleAddEmail = useCallback(async (data: { labelId: number; emailAddress: string; isPrimary: boolean }) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', ...data }),
      });
      if (response.ok) {
        await reloadContacts();
        showToast(t('form.messages.created'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error adding email:', error);
    }
  }, [selectedCompanyId, reloadContacts, showToast, t]);

  const handleEditEmail = useCallback(async (id: string, data: { labelId: number; emailAddress: string; isPrimary: boolean }) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/contacts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', itemId: id, ...data }),
      });
      if (response.ok) {
        await reloadContacts();
        showToast(t('form.messages.updated'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error updating email:', error);
    }
  }, [selectedCompanyId, reloadContacts, showToast, t]);

  const handleDeleteEmail = useCallback(async (id: string) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/contacts?type=email&itemId=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setEmails((prev) => prev.filter((e) => e.id !== id));
        showToast(t('form.messages.deleted'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  }, [selectedCompanyId, showToast, t]);

  const handleAddPhone = useCallback(async (data: { labelId: number; countryId: number; phoneNumber: string; isPrimary: boolean }) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'phone', ...data }),
      });
      if (response.ok) {
        await reloadContacts();
        showToast(t('form.messages.created'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error adding phone:', error);
    }
  }, [selectedCompanyId, reloadContacts, showToast, t]);

  const handleEditPhone = useCallback(async (id: string, data: { labelId: number; countryId: number; phoneNumber: string; isPrimary: boolean }) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/contacts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'phone', itemId: id, ...data }),
      });
      if (response.ok) {
        await reloadContacts();
        showToast(t('form.messages.updated'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error updating phone:', error);
    }
  }, [selectedCompanyId, reloadContacts, showToast, t]);

  const handleDeletePhone = useCallback(async (id: string) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/contacts?type=phone&itemId=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setPhones((prev) => prev.filter((p) => p.id !== id));
        showToast(t('form.messages.deleted'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error deleting phone:', error);
    }
  }, [selectedCompanyId, showToast, t]);

  const handleAddAddress = useCallback(async (data: {
    labelId: number; countryId: number; regionId: number; cityId: number;
    postalCode: string; street1: string; street2: string; isPrimary: boolean;
  }) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'address', ...data }),
      });
      if (response.ok) {
        await reloadContacts();
        showToast(t('form.messages.created'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error adding address:', error);
    }
  }, [selectedCompanyId, reloadContacts, showToast, t]);

  const handleEditAddress = useCallback(async (id: string, data: {
    labelId: number; countryId: number; regionId: number; cityId: number;
    postalCode: string; street1: string; street2: string; isPrimary: boolean;
  }) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/contacts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'address', itemId: id, ...data }),
      });
      if (response.ok) {
        await reloadContacts();
        showToast(t('form.messages.updated'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error updating address:', error);
    }
  }, [selectedCompanyId, reloadContacts, showToast, t]);

  const handleDeleteAddress = useCallback(async (id: string) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/contacts?type=address&itemId=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        showToast(t('form.messages.deleted'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  }, [selectedCompanyId, showToast, t]);

  const handleAddWebsite = useCallback(async (data: { labelId: number; url: string; isPrimary: boolean }) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'website', ...data }),
      });
      if (response.ok) {
        await reloadContacts();
        showToast(t('form.messages.created'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error adding website:', error);
    }
  }, [selectedCompanyId, reloadContacts, showToast, t]);

  const handleEditWebsite = useCallback(async (id: string, data: { labelId: number; url: string; isPrimary: boolean }) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/contacts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'website', itemId: id, ...data }),
      });
      if (response.ok) {
        await reloadContacts();
        showToast(t('form.messages.updated'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error updating website:', error);
    }
  }, [selectedCompanyId, reloadContacts, showToast, t]);

  const handleDeleteWebsite = useCallback(async (id: string) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/contacts?type=website&itemId=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setWebsites((prev) => prev.filter((w) => w.id !== id));
        showToast(t('form.messages.deleted'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error deleting website:', error);
    }
  }, [selectedCompanyId, showToast, t]);

  // Stakeholder CRUD handlers
  const handleAddStakeholder = useCallback(async (data: StakeholderUpsertPayload) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/stakeholders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await reloadStakeholders();
        showToast(t('form.messages.created'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error adding stakeholder:', error);
    }
  }, [selectedCompanyId, reloadStakeholders, showToast, t]);

  const handleEditStakeholder = useCallback(async (id: string, data: StakeholderUpsertPayload) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/stakeholders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await reloadStakeholders();
        showToast(t('form.messages.updated'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error updating stakeholder:', error);
    }
  }, [selectedCompanyId, reloadStakeholders, showToast, t]);

  const handleDeleteStakeholder = useCallback(async (id: string) => {
    if (!selectedCompanyId) return;
    try {
      const response = await fetch(`/api/company/${selectedCompanyId}/stakeholders/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setStakeholders((prev) => prev.filter((s) => s.id !== id));
        showToast(t('form.messages.deleted'), 'success');
      } else {
        const err = await response.json().catch(() => null);
        showToast(translateApiError(err?.message || '', t), 'error');
      }
    } catch (error) {
      console.error('Error deleting stakeholder:', error);
    }
  }, [selectedCompanyId, showToast, t]);

  // Mutation for updating company
  const mutation = useMutation({
    mutationFn: async (data: GeneralInformationFormData) => {
      const response = await fetch(`/api/company/${selectedCompanyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save company');
      }

      return response.json();
    },
    onSuccess: () => {
      const message = t('form.messages.companyUpdated', {
        defaultValue: 'Company updated successfully'
      });

      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );

      queryClient.invalidateQueries({ queryKey: ['companies-select'] });
    },
    onError: (error: Error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{translateApiError(error.message, t)}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const isSubmitting = mutation.status === 'pending';
  // Disable every editable affordance when (a) no company selected or
  // (b) caller is read-only on this company.
  const contactDisabled = !isEditMode || isReadOnly;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Selection Card — white border override (doubled .bg-card beats the page's blue border tint on specificity) */}
      <div
        className={
          '[&_div.rounded-xl.bg-card.bg-card]:border-black! ' +
          'dark:[&_div.rounded-xl.bg-card.bg-card]:border-white!'
        }
      >
        <CompanySelectionCard
          value={selectedCompanyId}
          onValueChange={setSelectedCompanyId}
          isEditMode={isEditMode}
        />
      </div>

      {/* Sections below appear only once a company is selected — no empty
          placeholder cards when nothing is chosen. */}
      {isEditMode && (
        <>
      {/* Section 1 — sky border to match badge */}
      <div className="[&_div.rounded-xl.bg-card.bg-card]:border-sky-500! dark:[&_div.rounded-xl.bg-card.bg-card]:border-sky-500!">
        <CompanyInformationSection titleKey="form.sections.nameHistory">
          {/* Name History Grid — name is managed via history entries, not a separate textbox */}
          <NameHistoryGrid
            nameHistory={nameHistory}
            onAdd={handleAddNameHistory}
            onEdit={handleEditNameHistory}
            onDelete={handleDeleteNameHistory}
            onDeleteTranslation={handleDeleteTranslation}
            disabled={contactDisabled}
            readOnly={isReadOnly}
          />
        </CompanyInformationSection>
      </div>

      {/* Section 2 — indigo border to match badge */}
      <div className="[&_div.rounded-xl.bg-card.bg-card]:border-indigo-500! dark:[&_div.rounded-xl.bg-card.bg-card]:border-indigo-500!">
        <RegistrationLegalSection
          formData={{
            registrationDate: formData.registrationDate,
            registrationNumber: formData.registrationNumber,
            registrationCountry: formData.registrationCountry,
            registrationRegion: formData.registrationRegion,
            registrationCity: formData.registrationCity,
            nationalId: formData.nationalId,
            economicCode: formData.economicCode,
          }}
          onInputChange={handleInputChange}
          disabled={contactDisabled}
          createdAt={companyAudit.createdAt}
          updatedAt={companyAudit.updatedAt}
        />
      </div>

      {/* Contact Data Grids */}
      {/* Section 3 — teal border to match badge */}
      <div className="[&_div.rounded-xl.bg-card.bg-card]:border-teal-500! dark:[&_div.rounded-xl.bg-card.bg-card]:border-teal-500!">
        <EmailsGrid
          emails={emails}
          onAdd={handleAddEmail}
          onEdit={handleEditEmail}
          onDelete={handleDeleteEmail}
          disabled={contactDisabled}
          readOnly={isReadOnly}
        />
      </div>

      {/* Section 4 — cyan border to match badge */}
      <div className="[&_div.rounded-xl.bg-card.bg-card]:border-cyan-600! dark:[&_div.rounded-xl.bg-card.bg-card]:border-cyan-600!">
        <PhonesGrid
          phones={phones}
          onAdd={handleAddPhone}
          onEdit={handleEditPhone}
          onDelete={handleDeletePhone}
          disabled={contactDisabled}
          readOnly={isReadOnly}
          labelOptions={phoneLabelOptions}
        />
      </div>

      {/* Section 5 — slate border to match badge */}
      <div className="[&_div.rounded-xl.bg-card.bg-card]:border-slate-500! dark:[&_div.rounded-xl.bg-card.bg-card]:border-slate-500!">
        <AddressesGrid
          addresses={addresses}
          onAdd={handleAddAddress}
          onEdit={handleEditAddress}
          onDelete={handleDeleteAddress}
          disabled={contactDisabled}
          readOnly={isReadOnly}
          labelOptions={addressLabelOptions}
        />
      </div>

      {/* Section 6 — violet border to match badge */}
      <div className="[&_div.rounded-xl.bg-card.bg-card]:border-violet-500! dark:[&_div.rounded-xl.bg-card.bg-card]:border-violet-500!">
        <WebsitesGrid
          websites={websites}
          onAdd={handleAddWebsite}
          onEdit={handleEditWebsite}
          onDelete={handleDeleteWebsite}
          disabled={contactDisabled}
          readOnly={isReadOnly}
        />
      </div>

      {/* Section 7 — emerald border to match badge */}
      <div className="[&_div.rounded-xl.bg-card.bg-card]:border-emerald-500! dark:[&_div.rounded-xl.bg-card.bg-card]:border-emerald-500!">
        <StakeholdersGrid
          stakeholders={stakeholders}
          onAdd={handleAddStakeholder}
          onEdit={handleEditStakeholder}
          onDelete={handleDeleteStakeholder}
          disabled={contactDisabled}
          readOnly={isReadOnly}
        />
      </div>

      {/* Section 8 — amber border to match badge. Self-contained: fetches its own
          documents + type list and saves via /api/company/document. */}
      <div className="[&_div.rounded-xl.bg-card.bg-card]:border-amber-500! dark:[&_div.rounded-xl.bg-card.bg-card]:border-amber-500!">
        <DocumentsSection companyId={selectedCompanyId} isReadOnly={isReadOnly} />
      </div>

      {/* Operations card — hidden entirely in view-only mode (nothing to submit). */}
      {!isReadOnly && (
        <div className="[&_div.rounded-xl.bg-card.bg-card]:border-black! dark:[&_div.rounded-xl.bg-card.bg-card]:border-white!">
          <Card>
            <CardHeader>
              <CardTitle>
                {t('form.sections.operations', { defaultValue: 'Operations' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-start gap-2">
                <RiInformationFill className="text-blue-600 dark:text-blue-400 size-5 shrink-0 mt-0.5" />
                <span className="text-sm text-card-foreground">
                  {t('form.messages.autoSubmitInfo', {
                    defaultValue: 'All operations are saved automatically, except {{section}}',
                    section: t('form.sections.registrationLegal', { defaultValue: 'Registration & Legal Information' }),
                  })}
                </span>
              </div>
              <div className="flex justify-end space-x-4 space-x-reverse">
                <Button type="submit" disabled={isSubmitting || !isEditMode}>
                  <Save className="h-4 w-4" />
                  {isSubmitting
                    ? t('form.actions.processing', {
                        defaultValue: 'Processing...'
                      })
                    : t('form.actions.update', {
                        defaultValue: 'Update Company'
                      })
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        </>
      )}
    </form>
  );
}
