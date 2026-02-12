import { create } from 'zustand';
import type { Organization } from '../types/organization';
import { supabase } from '../services/supabase/client';

interface OrganizationState {
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
  trialDaysRemaining: number | null;
  isTrialExpired: boolean;

  // Actions
  fetchOrganization: (userId: string) => Promise<void>;
  setOrganizationDirectly: (org: Organization) => void;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>;
  checkQuizLimit: () => boolean;
  incrementQuizUsage: () => Promise<void>;
  clearOrganization: () => void;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  currentOrganization: null,
  isLoading: false,
  error: null,
  trialDaysRemaining: null,
  isTrialExpired: false,

  fetchOrganization: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      // Look up organization through membership table
      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .single();

      if (memberError || !membership) {
        // No organization found - user is not a pro
        set({ currentOrganization: null, isLoading: false });
        return;
      }

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', membership.organization_id)
        .single();

      if (orgError) throw orgError;

      // Calculate trial status
      let trialDaysRemaining: number | null = null;
      let isTrialExpired = false;

      if (org.subscription_status === 'trial' && org.trial_ends_at) {
        const now = new Date();
        const trialEnd = new Date(org.trial_ends_at);
        const diffMs = trialEnd.getTime() - now.getTime();
        trialDaysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (trialDaysRemaining <= 0) {
          isTrialExpired = true;
          trialDaysRemaining = 0;
        }
      }

      set({
        currentOrganization: org as Organization,
        trialDaysRemaining,
        isTrialExpired,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message, isLoading: false });
    }
  },

  setOrganizationDirectly: (org: Organization) => {
    let trialDaysRemaining: number | null = null;
    let isTrialExpired = false;

    if (org.subscription_status === 'trial' && org.trial_ends_at) {
      const now = new Date();
      const trialEnd = new Date(org.trial_ends_at);
      const diffMs = trialEnd.getTime() - now.getTime();
      trialDaysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (trialDaysRemaining <= 0) {
        isTrialExpired = true;
        trialDaysRemaining = 0;
      }
    }

    set({
      currentOrganization: org,
      trialDaysRemaining,
      isTrialExpired,
      isLoading: false,
      error: null,
    });
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message });
      throw error;
    }
  },

  checkQuizLimit: () => {
    const { currentOrganization, isTrialExpired } = get();
    if (!currentOrganization) return true; // Allow if no organization (B2C user)
    if (isTrialExpired) return false; // Block if trial expired
    if (currentOrganization.subscription_status === 'cancelled') return false;
    if (currentOrganization.subscription_plan === 'pro') return true; // Pro = unlimited

    const limit = currentOrganization.monthly_quiz_limit ?? 0;
    return currentOrganization.quizzes_used_this_month < limit;
  },

  incrementQuizUsage: async () => {
    const { currentOrganization } = get();
    if (!currentOrganization) return;

    const newCount = currentOrganization.quizzes_used_this_month + 1;

    const { error } = await supabase
      .from('organizations')
      .update({ quizzes_used_this_month: newCount })
      .eq('id', currentOrganization.id);

    if (error) throw error;

    set({
      currentOrganization: {
        ...currentOrganization,
        quizzes_used_this_month: newCount,
      },
    });
  },

  clearOrganization: () => {
    set({
      currentOrganization: null,
      trialDaysRemaining: null,
      isTrialExpired: false,
      error: null,
    });
  },
}));
