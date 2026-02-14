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
      // 1. Check if user explicitly chose a language (saved by LanguageSelector)
      // 2. Detect browser language for new visitors
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'qb-user-lang',
      caches: [],  // Don't auto-cache — only LanguageSelector saves explicitly
    },
  });

export default i18n;
