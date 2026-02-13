// Language codes
export type LanguageCode = 'en' | 'fr' | 'es' | 'de';

// Difficulty levels
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// Question types
export type QuestionType = 'multiple_choice' | 'true_false' | 'open_ended';

// Question interface
export interface Question {
  id: string;
  quiz_id: string;
  stage_id: string;
  stage_order: number;
  global_order: number;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  fun_fact?: string;
  points: number;
  time_limit: number;
  difficulty: DifficultyLevel;
  created_at: string;
}

// Commercial break configuration
export interface CommercialBreakConfig {
  enabled: boolean;
  numberOfPauses: number;           // 0-5
  breakDurationSeconds: number;     // 180, 300, 600, 900, 1200
  promoMessage?: string;            // e.g. "Bières -15% !"
}

// Calculated break schedule (stored in session settings)
export interface CommercialBreakSchedule {
  breaks: Array<{
    afterQuestionIndex: number;     // 0-based: pause after this question
    durationSeconds: number;
    promoMessage?: string;
  }>;
}

// Quiz generation request
export interface QuizGenRequest {
  theme: string;
  questionCount: number;             // 5-100 questions (custom or preset 25/50/100)
  duration?: number;                // DEPRECATED: kept for backward compatibility
  difficulty: DifficultyLevel;
  language: LanguageCode;
  includeJokers: boolean;
  enabledJokers?: {
    protection: boolean;
    block: boolean;
    steal: boolean;
    double_points: boolean;
  };
  commercialBreaks?: CommercialBreakConfig;
}

// AI Quiz Response
export interface AIQuizResponse {
  title: string;
  description: string;
  estimatedDuration: number;
  stages: Array<{
    stageNumber: number;
    theme: string;
    questions: Array<{
      question_text: string;
      question_type: string;
      options: string[];
      correct_answer: string;
      explanation: string;
      fun_fact: string;
      points: number;
      time_limit: number;
      difficulty: string;
      micro_theme?: string; // ✅ Ajouté
    }>;
  }>;
}

// Quiz interface
export interface Quiz {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  total_stages: number;
  questions_per_stage: number;
  has_joker_rounds: boolean;
  stage_themes: string[];
  language: LanguageCode;
  difficulty: DifficultyLevel;
  estimated_duration: number;
  is_published: boolean;
  is_public: boolean;
  play_count: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

// Quiz Session
export interface QuizSession {
  id: string;
  quiz_id: string;
  session_code: string;
  host_id: string;
  status: 'waiting' | 'playing' | 'completed';
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
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

// Player
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
  threat_level: 'low' | 'medium' | 'high';
  protection_uses_remaining: number;
  block_uses_remaining: number;
  steal_uses_remaining: number;
  double_points_uses_remaining: number;
  joined_at: string;
  last_activity: string;
}
