export type GamePhase = 
  | 'theme_announcement'
  | 'question_display'
  | 'answer_selection'
  | 'results'
  | 'intermission';

export const PHASE_DURATIONS: Record<GamePhase, number> = {
  theme_announcement: 25,
  question_display: 10,
  answer_selection: 20,
  results: 8,
  intermission: 3,
};

export const PHASE_ORDER: GamePhase[] = [
  'theme_announcement',
  'question_display',
  'answer_selection',
  'results',
];

// ✅ CHANGÉ: 1 seul joker de chaque type (pas 2/10/10/5)
export const INITIAL_JOKER_INVENTORY = {
  protection: 1,
  block: 1,
  steal: 1,
  double_points: 1,
};
