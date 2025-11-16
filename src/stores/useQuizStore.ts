import { create } from 'zustand';
import type { Quiz, QuizSession, Player, Question, QuizGenRequest } from '../types/quiz';
import { supabase } from '../services/supabase/client';
import { generateMultiStageQuiz } from '../services/gemini';
import { v4 as uuidv4 } from 'uuid';

interface QuizState {
  // Current quiz data
  currentQuiz: Quiz | null;
  currentSession: QuizSession | null;
  currentPlayer: Player | null;
  currentQuestion: Question | null;
  isHost: boolean;
  sessionCode: string | null;
  
  // Players
  players: Player[];
  totalPlayers: number;
  
  // Progress
  currentStage: number;
  currentQuestionIndex: number;
  
  // UI State
  currentView: 'home' | 'create' | 'join' | 'lobby' | 'playing' | 'results' | 'tv-display';
  isLoading: boolean;
  error: string | null;
  
  // Realtime
  realtimeChannel: any;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  
  // Actions
  setCurrentView: (view: QuizState['currentView']) => void;
  setError: (error: string | null) => void;
  generateQuiz: (request: QuizGenRequest) => Promise<Quiz>;
  createSession: (quizId: string) => Promise<string>;
  joinSession: (code: string, playerName: string, email?: string) => Promise<void>;
  startSession: () => Promise<void>;
  setupRealtimeSubscription: (sessionCode: string) => void;
  cleanupRealtime: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  // Initial state
  currentQuiz: null,
  currentSession: null,
  currentPlayer: null,
  currentQuestion: null,
  isHost: false,
  sessionCode: null,
  players: [],
  totalPlayers: 0,
  currentStage: 0,
  currentQuestionIndex: 0,
  currentView: 'home',
  isLoading: false,
  error: null,
  realtimeChannel: null,
  connectionStatus: 'disconnected',

  setCurrentView: (view) => set({ currentView: view }),
  
  setError: (error) => set({ error }),

  generateQuiz: async (request) => {
    set({ isLoading: true, error: null });
    try {
      const aiResponse = await generateMultiStageQuiz(request);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate a valid UUID for creator_id (use user id or generate new one)
      const creatorId = user?.id || uuidv4();
      
      const quiz: Partial<Quiz> = {
        id: uuidv4(),
        creator_id: creatorId,
        title: aiResponse.title,
        description: aiResponse.description,
        total_stages: aiResponse.stages.length,
        questions_per_stage: aiResponse.stages[0]?.questions.length || 0,
        has_joker_rounds: request.includeJokers,
        stage_themes: aiResponse.stages.map(s => s.theme),
        language: request.language,
        difficulty: request.difficulty,
        estimated_duration: aiResponse.estimatedDuration,
        is_published: true,
        is_public: false,
        play_count: 0,
        average_rating: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('ai_generated_quizzes')
        .insert(quiz)
        .select()
        .single();

      if (error) throw error;

      // Insert questions
      const allQuestions = aiResponse.stages.flatMap((stage, stageIndex) =>
        stage.questions.map((q, qIndex) => ({
          ...q,
          id: uuidv4(),
          quiz_id: data.id,
          stage_id: `stage-${stageIndex}`,
          stage_order: qIndex,
          global_order: stageIndex * stage.questions.length + qIndex,
        }))
      );

      const { error: questionsError } = await supabase
        .from('ai_questions')
        .insert(allQuestions);

      if (questionsError) throw questionsError;

      set({ currentQuiz: data as Quiz, isLoading: false });
      return data as Quiz;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createSession: async (quizId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const sessionCode = await generateUniqueSessionCode();
      
      // Generate a valid UUID for host_id (use user id or generate new one)
      const hostId = user?.id || uuidv4();
      
      const session: Partial<QuizSession> = {
        id: uuidv4(),
        quiz_id: quizId,
        session_code: sessionCode,
        host_id: hostId,
        status: 'waiting',
        current_stage: 0,
        current_question: 0,
        unlimited_players: true,
        settings: {},
        party_mode: false,
        total_players: 0,
        active_players: 0,
        peak_concurrent_players: 0,
        strategic_mode_enabled: true,
        joker_actions_enabled: true,
        timing_phases: {
          announcement: 12,
          jokers: 12,
          question: 30,
          results: 5,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('quiz_sessions')
        .insert(session)
        .select()
        .single();

      if (error) throw error;

      set({
        currentSession: data as QuizSession,
        sessionCode,
        isHost: true,
        isLoading: false,
      });

      return sessionCode;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  joinSession: async (code, playerName, email) => {
    set({ isLoading: true, error: null });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('session_code', code)
        .single();

      if (sessionError) throw new Error('Session not found');
      if (session.status !== 'waiting') throw new Error('Session already started');

      const player: Partial<Player> = {
        id: uuidv4(),
        session_id: session.id,
        player_name: playerName,
        player_id: uuidv4(),
        email,
        avatar_emoji: getRandomEmoji(),
        player_color: getRandomColor(),
        total_score: 0,
        current_stage: 0,
        questions_answered: 0,
        correct_answers: 0,
        accuracy_percentage: 0,
        current_streak: 0,
        best_streak: 0,
        is_connected: true,
        strategic_actions_taken: 0,
        successful_strategic_actions: 0,
        threat_level: 'low',
        protection_uses_remaining: 2,
        block_uses_remaining: 10,
        steal_uses_remaining: 10,
        double_points_uses_remaining: 5,
        joined_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      };

      const { data: playerData, error: playerError } = await supabase
        .from('session_players')
        .insert(player)
        .select()
        .single();

      if (playerError) throw playerError;

      set({
        currentSession: session as QuizSession,
        currentPlayer: playerData as Player,
        sessionCode: code,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  startSession: async () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const { error } = await supabase
      .from('quiz_sessions')
      .update({ status: 'playing', started_at: new Date().toISOString() })
      .eq('id', currentSession.id);

    if (error) throw error;

    set({ currentView: 'playing' });
  },

  setupRealtimeSubscription: (sessionCode) => {
    const channel = supabase.channel(`quiz_session_${sessionCode}`);

    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'session_players',
        filter: `session_id=eq.${get().currentSession?.id}`,
      }, (payload) => {
        console.log('Player update:', payload);
        // Update players list
      })
      .on('broadcast', { event: 'phase_change' }, (payload) => {
        console.log('Phase change:', payload);
      })
      .subscribe((status) => {
        set({ connectionStatus: status === 'SUBSCRIBED' ? 'connected' : 'connecting' });
      });

    set({ realtimeChannel: channel });
  },

  cleanupRealtime: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      set({ realtimeChannel: null, connectionStatus: 'disconnected' });
    }
  },
}));

// Helper functions
const generateUniqueSessionCode = async (): Promise<string> => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const { data } = await supabase
    .from('quiz_sessions')
    .select('session_code')
    .eq('session_code', code)
    .single();

  return data ? generateUniqueSessionCode() : code;
};

const getRandomEmoji = () => {
  const emojis = ['😀', '😎', '🤓', '🥳', '🤩', '😇', '🤠', '🥸', '🤡', '👻'];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

const getRandomColor = () => {
  const colors = ['#E91E8C', '#8B3FE8', '#00D4FF', '#FFD700', '#FF6B35', '#B4FF39'];
  return colors[Math.floor(Math.random() * colors.length)];
};
