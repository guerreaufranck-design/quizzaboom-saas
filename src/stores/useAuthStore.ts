import { create } from 'zustand';
import { supabase } from '../services/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user, loading: false }),

  initialize: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      set({ user, loading: false, initialized: true });

      // Listen to auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null });
      });
    } catch (error) {
      console.error('Auth init error:', error);
      set({ loading: false, initialized: true });
    }
  },
}));
