/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language, translations, TranslationKey, SUPPORTED_LANGUAGES, LanguageInfo } from './translations';
import { CareerStorageService } from '../services/careerStorage';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  languages: LanguageInfo[];
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const settings = CareerStorageService.loadSettings();
    return (settings.language as Language) || 'es';
  });

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    const currentSettings = CareerStorageService.loadSettings();
    CareerStorageService.saveSettings({
      ...currentSettings,
      language: newLang,
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = translations[language] || translations.es;
      return (dict as Record<string, string>)[key] || translations.es[key] || String(key);
    },
    [language]
  );

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
