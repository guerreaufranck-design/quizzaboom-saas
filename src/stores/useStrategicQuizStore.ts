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
  broadcastPhaseChange: (sessionCode: string, data: PhaseData) => Promise<void>;
  
  openTargetSelector: (jokerType: 'block' | 'steal') => void;
  closeTargetSelector: () => void;
}

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
    const playerId = currentPlayer?.id || 'current-player-id';
    
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

    console.log('⚡ Executing joker:', jokerType, targetPlayerId);

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
    const playerId = currentPlayer?.id;
    
    if (!playerId) {
      console.error('❌ No player ID');
      return;
    }
    
    if (hasAnswered) return;
    if (activeEffects.blocks[playerId]) return;

    const isCorrect = answer === currentQuestion?.correct_answer;
    const timestamp = Date.now();
    
    let pointsEarned = 0;
    if (isCorrect) {
      const basePoints = currentQuestion?.points || 100;
      const hasDoublePoints = activeEffects.doublePoints[playerId];
      pointsEarned = hasDoublePoints ? basePoints * 2 : basePoints;
    }

    console.log('✅ Answer submitted:', answer, 'Correct:', isCorrect, 'Points:', pointsEarned);

    // ✅ CORRECTION: Récupérer les valeurs actuelles puis faire l'update
    if (isCorrect && pointsEarned > 0) {
      const { data: currentPlayerData } = await supabase
        .from('session_players')
        .select('total_score, correct_answers, questions_answered')
        .eq('id', playerId)
        .single();

      const newTotalScore = (currentPlayerData?.total_score || 0) + pointsEarned;
      const newCorrectAnswers = (currentPlayerData?.correct_answers || 0) + 1;
      const newQuestionsAnswered = (currentPlayerData?.questions_answered || 0) + 1;

      const { error } = await supabase
        .from('session_players')
        .update({ 
          total_score: newTotalScore,
          correct_answers: newCorrectAnswers,
          questions_answered: newQuestionsAnswered,
        })
        .eq('id', playerId);

      if (error) {
        console.error('❌ Failed to update score:', error);
      } else {
        console.log('💾 Score updated in DB:', newTotalScore);
        
        useQuizStore.setState((state) => {
          if (state.currentPlayer) {
            return {
              currentPlayer: {
                ...state.currentPlayer,
                total_score: newTotalScore,
                correct_answers: newCorrectAnswers,
                questions_answered: newQuestionsAnswered,
              }
            };
          }
          return state;
        });
      }
    } else if (!isCorrect) {
      // Incrémenter juste questions_answered si mauvaise réponse
      const { data: currentPlayerData } = await supabase
        .from('session_players')
        .select('questions_answered')
        .eq('id', playerId)
        .single();

      const newQuestionsAnswered = (currentPlayerData?.questions_answered || 0) + 1;

      await supabase
        .from('session_players')
        .update({ 
          questions_answered: newQuestionsAnswered,
        })
        .eq('id', playerId);
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
    console.log('👂 Listening to phase changes for session:', sessionCode);
    
    const channelName = `quiz_session_${sessionCode}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'phase_change' }, (payload) => {
        console.log('📢 Phase change broadcast received:', payload);
        get().setPhaseData(payload.payload as PhaseData);
      })
      .subscribe((status) => {
        console.log('📡 Phase listener status:', status, 'on channel:', channelName);
      });
  },

  broadcastPhaseChange: async (sessionCode, data) => {
    try {
      console.log('📤 Broadcasting phase change to session:', sessionCode, data.phase);
      
      const channelName = `quiz_session_${sessionCode}`;
      const channel = supabase.channel(channelName);
      
      await channel.send({
        type: 'broadcast',
        event: 'phase_change',
        payload: data,
      });

      console.log('✅ Phase broadcast sent to channel:', channelName);
    } catch (error) {
      console.error('❌ Failed to broadcast phase:', error);
    }
  },
}));
