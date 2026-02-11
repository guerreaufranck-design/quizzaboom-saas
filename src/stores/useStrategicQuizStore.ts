import { create } from 'zustand';
import { supabase } from '../services/supabase/client';
import type { JokerType } from '../types/joker';
import type { Question } from '../types/quiz';
import type { GamePhase } from '../types/gamePhases';
import { INITIAL_JOKER_INVENTORY } from '../types/gamePhases';
import { useQuizStore } from './useQuizStore';

interface PhaseData {
  phase: GamePhase;
  questionIndex: number;
  stageNumber: number;
  timeRemaining: number;
  currentQuestion: Question | null;
  themeTitle?: string;
}

interface StrategicQuizState {
  currentPhase: GamePhase;
  phaseTimeRemaining: number;
  currentStage: number;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  currentThemeTitle: string | null;
  allQuestions: Question[];
  
  playerInventory: {
    protection: number;
    block: number;
    steal: number;
    double_points: number;
  };
  
  activeEffects: {
    protections: Record<string, boolean>;
    blocks: Record<string, boolean>;
    steals: Record<string, string>;
    doublePoints: Record<string, boolean>;
  };
  
  selectedAnswer: string | null;
  hasAnswered: boolean;
  answerSubmittedAt: number | null;
  
  showTargetSelector: boolean;
  pendingJokerType: 'block' | 'steal' | null;
  
  loadQuestions: (quizId: string) => Promise<void>;
  setPhaseData: (data: PhaseData) => void;
  executeJokerAction: (jokerType: JokerType, targetPlayerId?: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  resetForNextQuestion: () => void;
  listenToPhaseChanges: (sessionCode: string) => void;
  reconnectToSession: (sessionId: string, sessionCode: string) => Promise<void>;
  getChannelState: () => string | null;
  broadcastPhaseChange: (sessionCode: string, data: PhaseData) => Promise<void>;

  openTargetSelector: (jokerType: 'block' | 'steal') => void;
  closeTargetSelector: () => void;
}

let globalRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;

export const useStrategicQuizStore = create<StrategicQuizState>((set, get) => ({
  currentPhase: 'theme_announcement',
  phaseTimeRemaining: 25,
  currentStage: 0,
  currentQuestionIndex: 0,
  currentQuestion: null,
  currentThemeTitle: null,
  allQuestions: [],
  playerInventory: INITIAL_JOKER_INVENTORY,
  activeEffects: {
    protections: {},
    blocks: {},
    steals: {},
    doublePoints: {},
  },
  selectedAnswer: null,
  hasAnswered: false,
  answerSubmittedAt: null,
  showTargetSelector: false,
  pendingJokerType: null,

  loadQuestions: async (quizId) => {
    try {
      const { data, error } = await supabase
        .from('ai_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('global_order', { ascending: true });

      if (error) throw error;

      console.log('✅ Loaded questions:', data.length);
      set({ 
        allQuestions: data as Question[],
        currentQuestion: data[0] as Question,
      });
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  },

  setPhaseData: (data) => {
    const { allQuestions } = get();
    const question = allQuestions[data.questionIndex] || null;
    
    console.log('📍 Phase data received:', data.phase, data);
    
    set({
      currentPhase: data.phase,
      phaseTimeRemaining: data.timeRemaining,
      currentQuestionIndex: data.questionIndex,
      currentStage: data.stageNumber,
      currentQuestion: question,
      currentThemeTitle: data.themeTitle || null,
    });

    if (data.phase === 'theme_announcement') {
      set({
        activeEffects: {
          protections: {},
          blocks: {},
          steals: {},
          doublePoints: {},
        },
        selectedAnswer: null,
        hasAnswered: false,
        answerSubmittedAt: null,
      });
    }
  },

  openTargetSelector: (jokerType) => {
    set({ showTargetSelector: true, pendingJokerType: jokerType });
  },

  closeTargetSelector: () => {
    set({ showTargetSelector: false, pendingJokerType: null });
  },

  executeJokerAction: async (jokerType, targetPlayerId) => {
    const { playerInventory, activeEffects, currentPhase } = get();
    const currentPlayer = useQuizStore.getState().currentPlayer;
    const playerId = currentPlayer?.id;
    
    if (!playerId) {
      throw new Error('No player ID');
    }
    
    if (currentPhase !== 'theme_announcement') {
      throw new Error('Jokers can only be activated during theme announcement');
    }
    
    if (playerInventory[jokerType] <= 0) {
      throw new Error('No uses remaining for this joker');
    }

    if ((jokerType === 'block' || jokerType === 'steal') && !targetPlayerId) {
      get().openTargetSelector(jokerType);
      return;
    }

    console.log('⚡ Executing joker:', jokerType, 'Target:', targetPlayerId);

    const sessionId = useQuizStore.getState().currentSession?.id;
    if (sessionId) {
      await supabase.from('joker_actions').insert({
        session_id: sessionId,
        player_id: playerId,
        target_player_id: targetPlayerId || null,
        action_type: jokerType,
        question_number: get().currentQuestionIndex,
        timestamp: Date.now(),
        action_order: 1,
      });
    }

    set({
      playerInventory: {
        ...playerInventory,
        [jokerType]: playerInventory[jokerType] - 1,
      },
    });

    switch (jokerType) {
      case 'protection':
        set({
          activeEffects: {
            ...activeEffects,
            protections: { ...activeEffects.protections, [playerId]: true },
          },
        });
        break;
      
      case 'double_points':
        set({
          activeEffects: {
            ...activeEffects,
            doublePoints: { ...activeEffects.doublePoints, [playerId]: true },
          },
        });
        break;
      
      case 'block':
        if (targetPlayerId) {
          set({
            activeEffects: {
              ...activeEffects,
              blocks: { ...activeEffects.blocks, [targetPlayerId]: true },
            },
          });
          get().closeTargetSelector();
        }
        break;
      
      case 'steal':
        if (targetPlayerId) {
          set({
            activeEffects: {
              ...activeEffects,
              steals: { ...activeEffects.steals, [targetPlayerId]: playerId },
            },
          });
          get().closeTargetSelector();
        }
        break;
    }
  },

  submitAnswer: async (answer) => {
    const { hasAnswered, activeEffects, currentQuestion } = get();
    const currentPlayer = useQuizStore.getState().currentPlayer;
    const sessionCode = useQuizStore.getState().sessionCode;
    const playerId = currentPlayer?.id;
    
    if (!playerId) {
      console.error('❌ No player ID');
      return;
    }
    
    if (hasAnswered) {
      console.log('⚠️ Already answered');
      return;
    }
    
    if (activeEffects.blocks[playerId]) {
      console.log('🚫 Player is blocked');
      return;
    }

    const isCorrect = answer === currentQuestion?.correct_answer;
    const timestamp = Date.now();
    
    let pointsToAdd = 0;
    if (isCorrect) {
      const basePoints = 5;
      const hasDoublePoints = activeEffects.doublePoints[playerId];
      pointsToAdd = hasDoublePoints ? basePoints * 2 : basePoints;
    }

    console.log('📤 Submitting answer:', answer, 'Correct:', isCorrect, 'Points to add:', pointsToAdd);

    try {
      // ✅ Essayer d'abord la fonction RPC
      const { error: rpcError } = await supabase.rpc('increment_player_score', {
        p_player_id: playerId,
        p_points: pointsToAdd,
        p_is_correct: isCorrect
      });

      if (rpcError) {
        console.log('⚠️ RPC not available, using manual update:', rpcError.message);
        
        // ✅ Fallback: Récupérer le score actuel puis mettre à jour
        const { data: currentData, error: fetchError } = await supabase
          .from('session_players')
          .select('total_score, correct_answers, questions_answered')
          .eq('id', playerId)
          .single();

        if (fetchError || !currentData) {
          console.error('❌ Fetch error:', fetchError);
          return;
        }

        console.log('📊 Current data:', currentData);

        const newTotalScore = currentData.total_score + pointsToAdd;
        const newCorrectAnswers = isCorrect ? currentData.correct_answers + 1 : currentData.correct_answers;
        const newQuestionsAnswered = currentData.questions_answered + 1;

        console.log('🔢 Updating:', currentData.total_score, '+', pointsToAdd, '=', newTotalScore);

        const { error: updateError } = await supabase
          .from('session_players')
          .update({
            total_score: newTotalScore,
            correct_answers: newCorrectAnswers,
            questions_answered: newQuestionsAnswered,
            last_activity: new Date().toISOString(),
          })
          .eq('id', playerId);

        if (updateError) {
          console.error('❌ Update error:', updateError);
          return;
        }

        console.log('💾 Score updated to:', newTotalScore);
      } else {
        console.log('✅ RPC success');
      }

      // ✅ Récupérer le nouveau score
      const { data: updatedPlayer } = await supabase
        .from('session_players')
        .select('total_score, correct_answers, questions_answered')
        .eq('id', playerId)
        .single();

      if (updatedPlayer) {
        console.log('✅ New total score:', updatedPlayer.total_score);
        
        useQuizStore.setState((state) => {
          if (state.currentPlayer) {
            return {
              currentPlayer: {
                ...state.currentPlayer,
                total_score: updatedPlayer.total_score,
                correct_answers: updatedPlayer.correct_answers,
                questions_answered: updatedPlayer.questions_answered,
              }
            };
          }
          return state;
        });
      }

      // Broadcaster
      if (sessionCode && globalRealtimeChannel) {
        await globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'score_updated',
          payload: { playerId, timestamp }
        });
      }

    } catch (error) {
      console.error('❌ Submit answer error:', error);
    }

    set({
      selectedAnswer: answer,
      hasAnswered: true,
      answerSubmittedAt: timestamp,
    });
  },

  resetForNextQuestion: () => {
    set({
      selectedAnswer: null,
      hasAnswered: false,
      answerSubmittedAt: null,
    });
  },

  listenToPhaseChanges: (sessionCode) => {
    if (globalRealtimeChannel) {
      console.log('🔌 Closing previous channel');
      supabase.removeChannel(globalRealtimeChannel);
      globalRealtimeChannel = null;
    }
    
    console.log('👂 Listening to phase changes for session:', sessionCode);
    
    const channelName = `quiz_session_${sessionCode}`;
    globalRealtimeChannel = supabase.channel(channelName);

    globalRealtimeChannel
      .on('broadcast', { event: 'phase_change' }, (payload: { payload: PhaseData }) => {
        console.log('📢 Phase change received:', payload.payload.phase);
        get().setPhaseData(payload.payload);
      })
      .on('broadcast', { event: 'timer_update' }, (payload: { payload: { timeRemaining: number } }) => {
        set({ phaseTimeRemaining: payload.payload.timeRemaining });
      })
      .on('broadcast', { event: 'score_updated' }, () => {
        const sessionId = useQuizStore.getState().currentSession?.id;
        if (sessionId) {
          useQuizStore.getState().loadPlayers(sessionId);
        }
      })
      .subscribe((status: string) => {
        console.log('📡 Realtime status:', status);
      });
  },

  reconnectToSession: async (sessionId, sessionCode) => {
    console.log('🔄 Reconnecting player to session...');

    // 1. Check if channel is still alive; if not, re-subscribe
    const channelState = globalRealtimeChannel?.state;
    if (!globalRealtimeChannel || channelState === 'closed' || channelState === 'errored') {
      console.log('🔌 Channel dead/missing, re-subscribing...');
      get().listenToPhaseChanges(sessionCode);
    }

    // 2. Fetch current phase from DB
    try {
      const { data: session, error } = await supabase
        .from('quiz_sessions')
        .select('settings, current_question, status')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Failed to fetch session for reconnection:', error);
        return;
      }

      // If quiz ended while we were away
      if (session.status === 'finished' || session.status === 'completed') {
        console.log('🏁 Quiz ended while disconnected');
        return;
      }

      const settings = session.settings as Record<string, unknown>;
      const currentPhase = settings?.currentPhase as PhaseData | undefined;

      if (currentPhase) {
        console.log('✅ Resynced to phase:', currentPhase.phase, 'question:', currentPhase.questionIndex);
        get().setPhaseData(currentPhase);
      }
    } catch (error) {
      console.error('Reconnection error:', error);
    }
  },

  getChannelState: () => {
    if (!globalRealtimeChannel) return null;
    return globalRealtimeChannel.state || null;
  },

  broadcastPhaseChange: async (sessionCode, data) => {
    try {
      const channelName = `quiz_session_${sessionCode}`;
      const channel = supabase.channel(channelName);
      
      await channel.send({
        type: 'broadcast',
        event: 'phase_change',
        payload: data,
      });

      console.log('✅ Phase broadcast sent');
    } catch (error) {
      console.error('❌ Broadcast error:', error);
    }
  },
}));
