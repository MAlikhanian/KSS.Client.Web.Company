'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useCompanies } from '@/hooks/use-companies';

const COMPANY_SELECTION_KEY = 'company-current-selection';

function loadStoredCompanyId(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(COMPANY_SELECTION_KEY) || '';
  } catch {
    return '';
  }
}

function saveStoredCompanyId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) window.localStorage.setItem(COMPANY_SELECTION_KEY, id);
    else window.localStorage.removeItem(COMPANY_SELECTION_KEY);
  } catch {}
}

interface CompanyContextType {
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
  selectedCompanyName: string;
  isEditMode: boolean;
  clearSelection: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string>('');
  const { companies } = useCompanies();

  // Hydrate from localStorage AFTER mount — useState's lazy initializer
  // can't read window during SSR. Same key the access page used previously
  // so existing selections aren't lost.
  useEffect(() => {
    const stored = loadStoredCompanyId();
    if (stored) {
      setSelectedCompanyIdState(stored);
    }
  }, []);

  const setSelectedCompanyId = useCallback((id: string) => {
    setSelectedCompanyIdState(id);
    saveStoredCompanyId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCompanyId('');
  }, [setSelectedCompanyId]);

  const selectedCompany = companies.find((company) => company.id === selectedCompanyId);
  const selectedCompanyName = selectedCompany?.name || '';
  const isEditMode = !!selectedCompanyId;

  return (
    <CompanyContext.Provider
      value={{
        selectedCompanyId,
        setSelectedCompanyId,
        selectedCompanyName,
        isEditMode,
        clearSelection,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
}
