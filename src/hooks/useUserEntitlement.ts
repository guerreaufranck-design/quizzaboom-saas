import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useOrganizationStore } from '../stores/useOrganizationStore';
import { supabase } from '../services/supabase/client';
import type { Organization } from '../types/organization';

export type EntitlementReason = 'ok' | 'no_credits' | 'trial_expired' | 'quota_reached' | 'cancelled';
export type UserType = 'b2c' | 'b2b' | 'new_user';

export interface UserEntitlement {
  canCreate: boolean;
  reason: EntitlementReason;
  userType: UserType;
  isLoading: boolean;
  availableCredits: number;
  organization: Organization | null;
  trialDaysRemaining: number | null;
  quizUsage: { used: number; limit: number } | null;
  consumeCredit: () => Promise<void>;
  refreshEntitlement: () => Promise<void>;
}

export function useUserEntitlement(): UserEntitlement {
  const { user } = useAuthStore();
  const {
    currentOrganization,
    isTrialExpired,
    trialDaysRemaining,
    isLoading: orgLoading,
    fetchOrganization,
    checkQuizLimit,
    incrementQuizUsage,
  } = useOrganizationStore();

  const [isLoading, setIsLoading] = useState(true);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [orgChecked, setOrgChecked] = useState(false);

  const loadEntitlement = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Check if user has an organization (B2B)
      await fetchOrganization(user.id);
      setOrgChecked(true);
    } catch {
      // No org = B2C user
      setOrgChecked(true);
    }
  }, [user, fetchOrganization]);

  // After org fetch completes, check B2C credits if not B2B
  useEffect(() => {
    if (!orgChecked || orgLoading || !user) return;

    const loadCredits = async () => {
      if (currentOrganization) {
        // B2B user → no need to fetch credits
        setIsLoading(false);
        return;
      }

      // B2C user → fetch purchase credits
      try {
        const { data, count } = await supabase
          .from('user_purchases')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('used', false);

        const { count: totalCount } = await supabase
          .from('user_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setAvailableCredits(count ?? data?.length ?? 0);
        setTotalPurchases(totalCount ?? 0);
      } catch {
        setAvailableCredits(0);
        setTotalPurchases(0);
      }

      setIsLoading(false);
    };

    loadCredits();
  }, [orgChecked, orgLoading, currentOrganization, user]);

  useEffect(() => {
    loadEntitlement();
  }, [loadEntitlement]);

  // Determine canCreate and reason
  let canCreate = false;
  let reason: EntitlementReason = 'no_credits';
  let userType: UserType = 'new_user';
  let quizUsage: { used: number; limit: number } | null = null;

  if (currentOrganization) {
    // B2B user
    userType = 'b2b';

    if (isTrialExpired) {
      reason = 'trial_expired';
    } else if (currentOrganization.subscription_status === 'cancelled') {
      reason = 'cancelled';
    } else if (!checkQuizLimit()) {
      reason = 'quota_reached';
      quizUsage = {
        used: currentOrganization.quizzes_used_this_month,
        limit: currentOrganization.monthly_quiz_limit ?? 5,
      };
    } else {
      canCreate = true;
      reason = 'ok';
      if (currentOrganization.subscription_plan !== 'pro') {
        quizUsage = {
          used: currentOrganization.quizzes_used_this_month,
          limit: currentOrganization.monthly_quiz_limit ?? 5,
        };
      }
    }
  } else if (!isLoading) {
    // B2C or new user
    if (availableCredits > 0) {
      userType = 'b2c';
      canCreate = true;
      reason = 'ok';
    } else if (totalPurchases > 0) {
      userType = 'b2c';
      reason = 'no_credits';
    } else {
      userType = 'new_user';
      reason = 'no_credits';
    }
  }

  const consumeCredit = async () => {
    if (!user) throw new Error('Not authenticated');

    if (currentOrganization) {
      // B2B: increment quiz usage
      await incrementQuizUsage();
    } else {
      // B2C: mark oldest unused purchase as used
      const { data } = await supabase
        .from('user_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('used', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!data) throw new Error('No available credits');

      const { error } = await supabase
        .from('user_purchases')
        .update({ used: true, updated_at: new Date().toISOString() })
        .eq('id', data.id)
        .eq('used', false); // Double check to prevent race condition

      if (error) throw error;

      setAvailableCredits((prev) => Math.max(0, prev - 1));
    }
  };

  return {
    canCreate,
    reason,
    userType,
    isLoading: isLoading || orgLoading,
    availableCredits,
    organization: currentOrganization,
    trialDaysRemaining,
    quizUsage,
    consumeCredit,
    refreshEntitlement: loadEntitlement,
  };
}
