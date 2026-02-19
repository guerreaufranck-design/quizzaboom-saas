import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
];

export const LanguageHeroSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.substring(0, 2) || 'en';

  return (
    <div className="flex justify-center gap-3 sm:gap-4">
      {LANGUAGES.map((lang) => {
        const isActive = currentLang === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => {
              i18n.changeLanguage(lang.code);
              localStorage.setItem('qb-user-lang', lang.code);
            }}
            className={`
              flex flex-col items-center gap-1.5 px-4 py-3 sm:px-6 sm:py-4 rounded-xl
              transition-all duration-200 cursor-pointer
              ${isActive
                ? 'bg-gradient-to-br from-qb-cyan/20 to-qb-purple/20 border-2 border-qb-cyan/50 scale-105 shadow-lg shadow-qb-cyan/10'
                : 'bg-white/5 border-2 border-white/10 hover:border-white/30 hover:bg-white/10 hover:scale-105'
              }
            `}
          >
            <span className="text-3xl sm:text-4xl">{lang.flag}</span>
            <span className={`text-xs sm:text-sm font-medium ${
              isActive ? 'text-qb-cyan' : 'text-white/60'
            }`}>
              {lang.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
