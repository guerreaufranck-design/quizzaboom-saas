import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'de', flag: '🇩🇪', label: 'DE' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
];

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.substring(0, 2) || 'en';

  return (
    <div className="flex items-center gap-1.5">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => {
            i18n.changeLanguage(lang.code);
            localStorage.setItem('qb-user-lang', lang.code);
          }}
          className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-base transition-all ${
            currentLang === lang.code
              ? 'bg-qb-cyan/20 text-qb-cyan font-bold ring-1 ring-qb-cyan/30'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
          title={lang.label}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
};
