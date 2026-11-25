import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pt from './locales/pt.json';
import en from './locales/en.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'pt', label: 'Português', region: 'Brasil • dd/mm/aaaa', flag: '🇧🇷', locale: 'pt-BR' },
  { code: 'en', label: 'English (UK)', region: 'Europe • dd/mm/yyyy', flag: '🇬🇧', locale: 'en-GB' },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

/** Retorna o locale BCP-47 ('pt-BR' ou 'en-GB') para Intl.DateTimeFormat / NumberFormat */
export function getAppLocale(language?: string): string {
  const code = (language || i18n.language || 'pt').slice(0, 2);
  return code === 'en' ? 'en-GB' : 'pt-BR';
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    supportedLngs: ['pt', 'en'],
    nonExplicitSupportedLngs: true,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;