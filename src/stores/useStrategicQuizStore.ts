import { create } from 'zustand';
import { supabase } from '../services/supabase/client';
import type { JokerType } from '../types/joker';

type Phase = 'announcement' | 'jokers' | 'question' | 'results';

interface StrategicQuizState {
  currentPhase: Phase;
  phaseTimeRemaining: number;
  currentTheme: string | null;
  playerInventory: {
    protection: number;
    block: number;
    steal: number;
    double_points: number;
  } | null;
  activeEffects: {
    protections: Record<string, boolean>;
    blocks: Record<string, boolean>;
    steals: Record<string, string>; // victimId -> thiefId
    doublePoints: Record<string, boolean>;
  };
  
  // Actions
  setCurrentPhase: (phase: Phase) => void;
  setPhaseTimeRemaining: (time: number) => void;
  executeJokerAction: (jokerType: JokerType, targetPlayerId?: string) => Promise<void>;
  broadcastPhaseChange: (data: { phase: Phase; questionIndex: number; timeRemaining: number }) => void;
}

export const useStrategicQuizStore = create<StrategicQuizState>((set, get) => ({
  currentPhase: 'announcement',
  phaseTimeRemaining: 12,
  currentTheme: null,
  playerInventory: {
    protection: 2,
    block: 10,
    steal: 10,
    double_points: 5,
  },
  activeEffects: {
    protections: {},
    blocks: {},
    steals: {},
    doublePoints: {},
  },

  setCurrentPhase: (phase) => set({ currentPhase: phase }),
  
  setPhaseTimeRemaining: (time) => set({ phaseTimeRemaining: time }),

  executeJokerAction: async (jokerType, targetPlayerId) => {
    const { playerInventory, activeEffects } = get();
    
    if (!playerInventory || playerInventory[jokerType] <= 0) {
      throw new Error('No uses remaining for this joker');
    }

    // Decrement inventory
    set({
      playerInventory: {
        ...playerInventory,
        [jokerType]: playerInventory[jokerType] - 1,
      },
    });

    // Apply effect
    const playerId = 'current-player-id'; // TODO: Get from useQuizStore
    
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

  broadcastPhaseChange: (data) => {
    // Broadcast via Supabase Realtime
    const channel = supabase.channel('quiz-phases');
    channel.send({
      type: 'broadcast',
      event: 'phase_change',
      payload: data,
    });
  },
}));
