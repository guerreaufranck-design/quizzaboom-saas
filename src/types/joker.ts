export type JokerType = 'protection' | 'block' | 'steal' | 'double_points';

export interface JokerAction {
  id: string;
  session_id: string;
  player_id: string;
  question_number: number;
  question_theme: string;
  action_type: JokerType;
  target_player_id?: string;
  timestamp: number;
  action_order: number;
  response_time: number;
  resolution_status: 'pending' | 'success' | 'failed';
  failure_reason?: string;
  points_affected?: number;
}

export interface JokerInventory {
  protection: number;
  block: number;
  steal: number;
  double_points: number;
}

export interface JokerEffects {
  protections: Record<string, boolean>;
  blocks: Record<string, boolean>;
  steals: Record<string, string>;
  doublePoints: Record<string, boolean>;
}

export interface JokerResolution {
  effects: JokerEffects;
  conflicts: JokerAction[];
  resolutionOrder: JokerAction[];
}

export type GamePhase = 'announcement' | 'jokers' | 'question' | 'results';

export interface JokerPhaseState {
  phase: GamePhase;
  timeRemaining: number;
  currentTheme?: string;
  pendingActions: JokerAction[];
}
