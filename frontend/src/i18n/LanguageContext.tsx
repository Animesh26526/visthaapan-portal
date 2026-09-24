import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { SupportedLanguage, LanguageOption } from './types';
import { SUPPORTED_LANGUAGES } from './types';
import { translations } from './translations';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string, params?: Record<string, string | number>) => string;
  supportedLanguages: LanguageOption[];
  currentLanguageMeta: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'visthaapan_lang';

function resolveKey(obj: any, keyPath: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  if (typeof obj[keyPath] === 'string') return obj[keyPath];

  // Try dot-separated traversal
  const parts = keyPath.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
      if (saved && translations[saved]) {
        return saved;
      }
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    if (translations[lang]) {
      setCurrentLanguageState(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, lang);
      }
    }
  };

  useEffect(() => {
    // Set document lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  const currentLanguageMeta = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [currentLanguage]);

  const t = (key: string, fallback?: string, params?: Record<string, string | number>): string => {
    let resolved =
      resolveKey(translations[currentLanguage], key) ||
      resolveKey(translations.en, key) ||
      fallback ||
      key;

    if (params && typeof resolved === 'string') {
      for (const [k, v] of Object.entries(params)) {
        resolved = resolved.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }

    return resolved;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        currentLanguageMeta,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
