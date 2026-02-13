export type GamePhase =
  | 'theme_announcement'
  | 'question_display'
  | 'answer_selection'
  | 'results'
  | 'intermission'
  | 'commercial_break'
  | 'quiz_complete';

export const PHASE_DURATIONS: Record<GamePhase, number> = {
  theme_announcement: 5,
  question_display: 8,
  answer_selection: 15,
  results: 8,
  intermission: 5,
  commercial_break: 0, // Dynamic — set by break schedule
  quiz_complete: 0,
};

// Normal phase flow (commercial_break is injected conditionally, not here)
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
