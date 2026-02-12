import type { LanguageCode } from '../types/quiz';

const CORRECT_ANSWER_PREFIX: Record<LanguageCode, string> = {
  en: 'The correct answer is:',
  fr: 'La bonne reponse est :',
  de: 'Die richtige Antwort ist:',
  es: 'La respuesta correcta es:',
};

const THEME_PREFIX: Record<LanguageCode, string> = {
  en: 'Next theme:',
  fr: 'Prochain theme :',
  de: 'Nachstes Thema:',
  es: 'Siguiente tema:',
};

export function getResultsAnnouncement(correctAnswer: string, language: LanguageCode): string {
  return `${CORRECT_ANSWER_PREFIX[language]} ${correctAnswer}`;
}

export function getThemeAnnouncement(theme: string, language: LanguageCode): string {
  return `${THEME_PREFIX[language]} ${theme}`;
}
