import { create } from 'zustand';
import type { Quiz, QuizSession, Player, Question, QuizGenRequest } from '../types/quiz';
import { supabase } from '../services/supabase/client';
import { generateMultiStageQuiz } from '../services/gemini';
import { v4 as uuidv4 } from 'uuid';

interface QuizState {
  currentQuiz: Quiz | null;
  currentSession: QuizSession | null;
  currentPlayer: Player | null;
  currentQuestion: Question | null;
  isHost: boolean;
  sessionCode: string | null;
  players: Player[];
  totalPlayers: number;
  currentStage: number;
  currentQuestionIndex: number;
  currentView: 'home' | 'pricing' | 'create' | 'join' | 'lobby' | 'playing' | 'results' | 'tv-display';
  isLoading: boolean;
  error: string | null;
  realtimeChannel: any;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  
  setCurrentView: (view: QuizState['currentView']) => void;
  setError: (error: string | null) => void;
  generateQuiz: (request: QuizGenRequest) => Promise<Quiz>;
  createSession: (quizId: string) => Promise<string>;
  joinSession: (code: string, playerName: string, email?: string, avatarEmoji?: string) => Promise<void>;
  loadPlayers: (sessionId: string) => Promise<void>;
  startSession: () => Promise<void>;
  setupRealtimeSubscription: (sessionCode: string) => void;
  cleanupRealtime: () => void;
  restoreSession: () => Promise<void>;
  saveSessionState: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
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
  currentView: 'home' | 'pricing',
  isLoading: false,
  error: null,
  realtimeChannel: null,
  connectionStatus: 'disconnected',

  setCurrentView: (view) => {
    console.log('📍 View changed to:', view);
    set({ currentView: view });
    get().saveSessionState();
  },
  
  setError: (error) => set({ error }),

  saveSessionState: () => {
    const state = get();
    const sessionData = {
      sessionCode: state.sessionCode,
      isHost: state.isHost,
      currentView: state.currentView,
      quizId: state.currentQuiz?.id,
      sessionId: state.currentSession?.id,
      playerId: state.currentPlayer?.id,
    };
    console.log('💾 Saving session state');
    sessionStorage.setItem('quizzaboom_session', JSON.stringify(sessionData));
  },

  restoreSession: async () => {
    const saved = sessionStorage.getItem('quizzaboom_session');
    if (!saved) return;

    try {
      const sessionData = JSON.parse(saved);
      
      if (sessionData.quizId) {
        const { data: quiz } = await supabase
          .from('ai_generated_quizzes')
          .select('*')
          .eq('id', sessionData.quizId)
          .single();
        
        if (quiz) set({ currentQuiz: quiz as Quiz });
      }

      if (sessionData.sessionId) {
        const { data: session } = await supabase
          .from('quiz_sessions')
          .select('*')
          .eq('id', sessionData.sessionId)
          .single();
        
        if (session) {
          set({ 
            currentSession: session as QuizSession,
            sessionCode: sessionData.sessionCode,
          });
          await get().loadPlayers(sessionData.sessionId);
          if (sessionData.sessionCode) {
            get().setupRealtimeSubscription(sessionData.sessionCode);
          }
        }
      }

      if (sessionData.playerId) {
        const { data: player } = await supabase
          .from('session_players')
          .select('*')
          .eq('id', sessionData.playerId)
          .single();
        
        if (player) set({ currentPlayer: player as Player });
      }

      set({
        isHost: sessionData.isHost,
        currentView: sessionData.currentView || 'playing',
      });

    } catch (error) {
      console.error('Failed to restore session:', error);
      sessionStorage.removeItem('quizzaboom_session');
    }
  },

  generateQuiz: async (request) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🎨 Generating quiz with AI...');
      const aiResponse = await generateMultiStageQuiz(request);
      
      console.log('✅ AI generation complete, saving to DB...');
      
      const { data: { user } } = await supabase.auth.getUser();
      const creatorId = user?.id || uuidv4();
      
      const quizId = uuidv4();
      
      const quiz: Partial<Quiz> = {
        id: quizId,
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

      console.log('💾 Inserting quiz:', quiz.title);

      const { data: quizData, error: quizError } = await supabase
        .from('ai_generated_quizzes')
        .insert(quiz)
        .select()
        .single();

      if (quizError) {
        console.error('❌ Quiz insert error:', quizError);
        throw new Error(`Database error: ${quizError.message}`);
      }

      console.log('✅ Quiz inserted, ID:', quizData.id);

      const allQuestions = aiResponse.stages.flatMap((stage, stageIndex) =>
        stage.questions.map((q, qIndex) => ({
          id: uuidv4(),
          quiz_id: quizData.id,
          stage_id: q.micro_theme || `Stage ${stageIndex + 1}`,
          stage_order: qIndex,
          global_order: stageIndex * stage.questions.length + qIndex,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          fun_fact: q.fun_fact,
          points: q.points || 100,
          time_limit: q.time_limit || 20,
          created_at: new Date().toISOString(),
        }))
      );

      console.log(`💾 Inserting ${allQuestions.length} questions...`);

      const { error: questionsError } = await supabase
        .from('ai_questions')
        .insert(allQuestions);

      if (questionsError) {
        console.error('❌ Questions insert error:', questionsError);
        throw new Error(`Failed to save questions: ${questionsError.message}`);
      }

      console.log('✅ All questions saved');

      set({ currentQuiz: quizData as Quiz, isLoading: false });
      return quizData as Quiz;
      
    } catch (error: any) {
      console.error('❌ Generate quiz error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createSession: async (quizId) => {
    set({ isLoading: true, error: null });
    try {
      console.log('📝 Creating session for quiz:', quizId);
      
      const { data: { user } } = await supabase.auth.getUser();
      const sessionCode = await generateUniqueSessionCode();
      const hostId = user?.id || uuidv4();
      
      const sessionId = uuidv4();
      
      const session: Partial<QuizSession> = {
        id: sessionId,
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
          announcement: 15,
          jokers: 0,
          question: 10,
          results: 10,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('💾 Inserting session:', sessionCode);

      const { data, error } = await supabase
        .from('quiz_sessions')
        .insert(session)
        .select()
        .single();

      if (error) {
        console.error('❌ Session insert error:', error);
        throw new Error(`Failed to create session: ${error.message}`);
      }

      console.log('✅ Session created:', sessionCode);

      set({
        currentSession: data as QuizSession,
        sessionCode,
        isHost: true,
        isLoading: false,
      });

      get().saveSessionState();
      return sessionCode;
      
    } catch (error: any) {
      console.error('❌ Create session error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  joinSession: async (code, playerName, email, avatarEmoji) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🎮 Joining session:', code);
      
      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('session_code', code)
        .single();

      if (sessionError) throw new Error('Session not found');

      const { data: quiz, error: quizError } = await supabase
        .from('ai_generated_quizzes')
        .select('*')
        .eq('id', session.quiz_id)
        .single();

      if (quizError) throw new Error('Quiz not found');

      const player: Partial<Player> = {
        id: uuidv4(),
        session_id: session.id,
        player_name: playerName,
        player_id: uuidv4(),
        email,
        avatar_emoji: avatarEmoji || getRandomEmoji(),
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

      const { data: allPlayers } = await supabase
        .from('session_players')
        .select('*')
        .eq('session_id', session.id)
        .order('joined_at', { ascending: true });

      // ✅ Déterminer la vue initiale selon le statut de la session
      const initialView = session.status === 'playing' ? 'playing' : 'lobby';
      console.log(`✅ Join complete! Session status: ${session.status}, redirecting to: ${initialView}`);

      set({
        currentSession: session as QuizSession,
        currentQuiz: quiz as Quiz,
        currentPlayer: playerData as Player,
        sessionCode: code,
        isHost: false,
        players: (allPlayers as Player[]) || [],
        totalPlayers: allPlayers?.length || 0,
        isLoading: false,
        currentView: initialView, // ✅ Lobby si waiting, playing si déjà lancé
      });

      get().saveSessionState();
      get().setupRealtimeSubscription(code);

    } catch (error: any) {
      console.error('❌ Join error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  loadPlayers: async (sessionId) => {
    try {
      const { data, error } = await supabase
        .from('session_players')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      set({
        players: (data as Player[]) || [],
        totalPlayers: data?.length || 0,
      });
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  },

  startSession: async () => {
    const { currentSession, sessionCode } = get();
    if (!currentSession || !sessionCode) return;

    console.log('🚀 Starting session:', sessionCode);

    const { error } = await supabase
      .from('quiz_sessions')
      .update({ status: 'playing', started_at: new Date().toISOString() })
      .eq('id', currentSession.id);

    if (error) throw error;

    // ✅ Broadcast aux joueurs que le quiz démarre
    const channel = supabase.channel(`quiz_session_${sessionCode}`);
    await channel.send({
      type: 'broadcast',
      event: 'quiz_started',
      payload: { sessionId: currentSession.id }
    });

    console.log('✅ Session started, broadcasted to players');

    set({ currentView: 'playing' });
    get().saveSessionState();
  },

  setupRealtimeSubscription: (sessionCode) => {
    const { currentSession, realtimeChannel, isHost } = get();
    
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    if (!currentSession) return;

    console.log('🔌 Setting up realtime for session:', sessionCode);

    const channel = supabase.channel(`quiz_session_${sessionCode}`);

    // ✅ Écouter les changements de players
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_players',
        filter: `session_id=eq.${currentSession.id}`,
      },
      (payload) => {
        console.log('🔄 Player event:', payload.eventType);
        get().loadPlayers(currentSession.id);
      }
    );

    // ✅ NOUVEAU : Écouter les changements de la session (status)
    if (!isHost) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quiz_sessions',
          filter: `id=eq.${currentSession.id}`,
        },
        (payload: any) => {
          console.log('🔄 Session status changed:', payload.new.status);
          if (payload.new.status === 'playing') {
            console.log('🎯 Quiz started! Redirecting to playing view...');
            set({ 
              currentView: 'playing',
              currentSession: payload.new as QuizSession 
            });
            get().saveSessionState();
          }
        }
      );
    }

    // ✅ Écouter le broadcast de démarrage du quiz
    if (!isHost) {
      channel.on('broadcast', { event: 'quiz_started' }, (payload) => {
        console.log('📢 Received quiz_started broadcast:', payload);
        set({ currentView: 'playing' });
        get().saveSessionState();
      });
    }

    // ✅ Écouter les changements de phase
    channel.on('broadcast', { event: 'phase_change' }, (payload) => {
      console.log('📢 Phase change:', payload);
    });

    channel.subscribe((status) => {
      console.log('📡 Realtime status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to realtime channel');
        set({ connectionStatus: 'connected' });
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime channel error');
        set({ connectionStatus: 'disconnected' });
      } else {
        set({ connectionStatus: 'connecting' });
      }
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
