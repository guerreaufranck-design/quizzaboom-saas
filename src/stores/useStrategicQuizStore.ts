import { create } from 'zustand';
import { supabase } from '../services/supabase/client';
import type { JokerType } from '../types/joker';
import type { Question } from '../types/quiz';
import type { GamePhase } from '../types/gamePhases';
import { INITIAL_JOKER_INVENTORY } from '../types/gamePhases';

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
  
  loadQuestions: (quizId: string) => Promise<void>;
  setPhaseData: (data: PhaseData) => void;
  executeJokerAction: (jokerType: JokerType, targetPlayerId?: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  resetForNextQuestion: () => void;
  listenToPhaseChanges: (sessionCode: string) => void;
  broadcastPhaseChange: (sessionCode: string, data: PhaseData) => Promise<void>;
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

  executeJokerAction: async (jokerType, targetPlayerId) => {
    const { playerInventory, activeEffects, currentPhase } = get();
    const playerId = 'current-player-id';
    
    if (currentPhase !== 'theme_announcement') {
      throw new Error('Jokers can only be activated during theme announcement');
    }
    
    if (playerInventory[jokerType] <= 0) {
      throw new Error('No uses remaining for this joker');
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
        }
        break;
    }
  },

  submitAnswer: async (answer) => {
    const { hasAnswered, activeEffects, currentQuestion } = get();
    const playerId = 'current-player-id';
    
    if (hasAnswered) return;
    if (activeEffects.blocks[playerId]) return;

    const isCorrect = answer === currentQuestion?.correct_answer;
    const timestamp = Date.now();

    console.log('✅ Answer submitted:', answer, 'Correct:', isCorrect);

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
    
    // Utiliser le MÊME nom de channel que le broadcaster
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
      
      // Utiliser le MÊME nom de channel que le listener
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
