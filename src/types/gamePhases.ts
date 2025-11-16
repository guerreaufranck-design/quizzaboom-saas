export type GamePhase = 
  | 'theme_announcement'
  | 'question_display'
  | 'answer_selection'
  | 'results'
  | 'intermission';

export const PHASE_DURATIONS: Record<GamePhase, number> = {
  theme_announcement: 15, // 25s → 15s
  question_display: 10,   // 15s → 10s
  answer_selection: 10,   // 20s → 10s
  results: 10,            // 20s → 10s
  intermission: 6,        // Reste 6s (Get Ready)
};

export const PHASE_ORDER: GamePhase[] = [
  'theme_announcement',
  'question_display',
  'answer_selection',
  'results',
  'intermission',
];

export const INITIAL_JOKER_INVENTORY = {
  protection: 1,
  block: 1,
  steal: 1,
  double_points: 1,
};
