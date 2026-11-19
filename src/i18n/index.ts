import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pt from './locales/pt.json';
import en from './locales/en.json';
import it from './locales/it.json';
import fi from './locales/fi.json';
import vi from './locales/vi.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'fi', label: 'Suomi', flag: '🇫🇮' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
] as const;

i18n
  .use(LanguageDetector) // Detecta idioma do navegador e salva no localStorage
  .use(initReactI18next) // Conecta com o React
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      it: { translation: it },
      fi: { translation: fi },
      vi: { translation: vi },
    },
    fallbackLng: 'pt', // Se o navegador estiver em outro idioma, usa Português
    interpolation: {
      escapeValue: false, // O React já protege contra XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;