export interface Quiz {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  total_stages: number;
  questions_per_stage: number;
  has_joker_rounds: boolean;
  stage_themes: string[];
  language: 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt';
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_duration: number;
  is_published: boolean;
  is_public: boolean;
  play_count: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  stage_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: string;
  explanation: string;
  fun_fact: string;
  points: number;
  time_limit: number;
  stage_order: number;
  global_order: number;
  is_joker_question: boolean;
  joker_type?: string;
  image_url?: string;
  audio_url?: string;
  video_url?: string;
}

export interface QuizSession {
  id: string;
  quiz_id: string;
  session_code: string;
  host_id: string;
  status: 'waiting' | 'playing' | 'finished';
  current_stage: number;
  current_question: number;
  unlimited_players: boolean;
  settings: Record<string, any>;
  party_mode: boolean;
  total_players: number;
  active_players: number;
  peak_concurrent_players: number;
  strategic_mode_enabled: boolean;
  joker_actions_enabled: boolean;
  timing_phases: {
    announcement: number;
    jokers: number;
    question: number;
    results: number;
  };
  started_at?: string;
  finished_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  session_id: string;
  player_name: string;
  player_id: string;
  email?: string;
  avatar_emoji: string;
  player_color: string;
  total_score: number;
  current_stage: number;
  questions_answered: number;
  correct_answers: number;
  accuracy_percentage: number;
  current_streak: number;
  best_streak: number;
  is_connected: boolean;
  strategic_actions_taken: number;
  successful_strategic_actions: number;
  threat_level: 'low' | 'medium' | 'high' | 'extreme';
  protection_uses_remaining: number;
  block_uses_remaining: number;
  steal_uses_remaining: number;
  double_points_uses_remaining: number;
  joined_at: string;
  last_activity: string;
}

export interface QuizGenRequest {
  theme: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  language: 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt';
  includeJokers: boolean;
  categories?: string[];
}

export interface AIQuizResponse {
  title: string;
  description: string;
  stages: QuizStage[];
  estimatedDuration: number;
}

export interface QuizStage {
  stageNumber: number;
  theme: string;
  questions: Question[];
}
