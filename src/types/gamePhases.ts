export type GamePhase = 
  | 'theme_announcement'
  | 'question_display'
  | 'answer_selection'
  | 'results'
  | 'intermission';

export const PHASE_DURATIONS: Record<GamePhase, number> = {
  theme_announcement: 5,
  question_display: 8,
  answer_selection: 15,
  results: 5,
  intermission: 5,
};

export const PHASE_ORDER: GamePhase[] = [
  'theme_announcement',
  'question_display',
  'answer_selection',
  'results',
];

export const INITIAL_JOKER_INVENTORY = {
  protection: 1,
  block: 1,
  steal: 1,
  double_points: 1,
};
