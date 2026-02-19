import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import fr from './fr.json';
import de from './de.json';
import es from './es.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
      es: { translation: es },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Only use explicitly saved preference — default to English for all new visitors
      order: ['localStorage'],
      lookupLocalStorage: 'qb-user-lang',
      caches: [],  // Don't auto-cache — only LanguageSelector saves explicitly
    },
  });

export default i18n;
