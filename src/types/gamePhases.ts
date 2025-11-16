export type GamePhase = 
  | 'theme_announcement'  // 20-30s - Annonce thème + activation jokers
  | 'question_display'    // 15s - Affichage question seule
  | 'answer_selection'    // 20s - Choix des réponses A/B/C/D
  | 'results'             // 20s - Résultats + Top 5
  | 'intermission';       // 5-8s - Pause entre questions

export const PHASE_DURATIONS: Record<GamePhase, number> = {
  theme_announcement: 25,  // 25s moyenne entre 20-30s
  question_display: 15,
  answer_selection: 20,
  results: 20,
  intermission: 6,         // 6s moyenne entre 5-8s
};

export const PHASE_ORDER: GamePhase[] = [
  'theme_announcement',
  'question_display',
  'answer_selection',
  'results',
  'intermission',
];

// Inventaire jokers : 1 de chaque pour tout le quiz
export const INITIAL_JOKER_INVENTORY = {
  protection: 1,
  block: 1,
  steal: 1,
  double_points: 1,
};
