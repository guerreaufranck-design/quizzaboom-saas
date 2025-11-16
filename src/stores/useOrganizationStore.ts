import { create } from 'zustand';
import type { Organization } from '../types/organization';
import { supabase } from '../services/supabase/client';

interface OrganizationState {
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchOrganization: (userId: string) => Promise<void>;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>;
  checkQuizLimit: () => boolean;
  incrementQuizUsage: () => Promise<void>;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  currentOrganization: null,
  isLoading: false,
  error: null,

  fetchOrganization: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      set({ currentOrganization: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateOrganization: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set({ currentOrganization: data });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  checkQuizLimit: () => {
    const { currentOrganization } = get();
    if (!currentOrganization) return false;
    if (currentOrganization.subscription_plan === 'pro') return true;
    
    return (
      currentOrganization.quizzes_used_this_month 
      (currentOrganization.monthly_quiz_limit || 0)
    );
  },

  incrementQuizUsage: async () => {
    const { currentOrganization } = get();
    if (!currentOrganization) return;

    const { error } = await supabase
      .from('organizations')
      .update({
        quizzes_used_this_month: currentOrganization.quizzes_used_this_month + 1,
      })
      .eq('id', currentOrganization.id);

    if (error) throw error;
  },
}));
