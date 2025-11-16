import { create } from 'zustand';
import type { GamePhase, JokerAction, JokerInventory, JokerEffects } from '../types/joker';
import { gameEngine } from '../services/strategicGameEngine';
import { supabase } from '../services/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface StrategicQuizState {
  // Current phase
  currentPhase: GamePhase | null;
  phaseTimeRemaining: number;
  currentTheme: string | null;
  
  // Joker system
  pendingJokerActions: JokerAction[];
  activeEffects: JokerEffects;
  playerInventory: JokerInventory | null;
  
  // Actions
  setPhase: (phase: GamePhase, duration: number, theme?: string) => void;
  updateTimer: (timeRemaining: number) => void;
  executeJokerAction: (actionType: JokerAction['action_type'], targetId?: string) => Promise<void>;
  resolveJokerPhase: () => Promise<void>;
  resetPhase: () => void;
}

export const useStrategicQuizStore = create<StrategicQuizState>((set, get) => ({
  currentPhase: null,
  phaseTimeRemaining: 0,
  currentTheme: null,
  pendingJokerActions: [],
  activeEffects: {
    protections: {},
    blocks: {},
    steals: {},
    doublePoints: {},
  },
  playerInventory: {
    protection: 2,
    block: 10,
    steal: 10,
    double_points: 5,
  },

  setPhase: (phase, duration, theme) => {
    set({
      currentPhase: phase,
      phaseTimeRemaining: duration,
      currentTheme: theme,
    });
  },

  updateTimer: (timeRemaining) => {
    set({ phaseTimeRemaining: timeRemaining });
  },

  executeJokerAction: async (actionType, targetId) => {
    const { playerInventory, pendingJokerActions } = get();
    
    if (!playerInventory || !gameEngine.validatePlayerAction('current-player', actionType, playerInventory as any)) {
      throw new Error('Not enough joker uses remaining');
    }

    const action: JokerAction = {
      id: uuidv4(),
      session_id: 'current-session',
      player_id: 'current-player',
      question_number: 1,
      question_theme: get().currentTheme || '',
      action_type: actionType,
      target_player_id: targetId,
      timestamp: Date.now(),
      action_order: pendingJokerActions.length,
      response_time: 0,
      resolution_status: 'pending',
    };

    // Save to database
    await supabase.from('joker_actions').insert(action);

    // Update local state
    set({
      pendingJokerActions: [...pendingJokerActions, action],
      playerInventory: {
        ...playerInventory,
        [actionType]: playerInventory[actionType] - 1,
      },
    });
  },

  resolveJokerPhase: async () => {
    const { pendingJokerActions } = get();
    
    const resolution = gameEngine.resolveJokerActions(pendingJokerActions);
    
    set({
      activeEffects: resolution.effects,
      pendingJokerActions: [],
    });

    return Promise.resolve();
  },

  resetPhase: () => {
    set({
      currentPhase: null,
      phaseTimeRemaining: 0,
      currentTheme: null,
      pendingJokerActions: [],
    });
  },
}));
