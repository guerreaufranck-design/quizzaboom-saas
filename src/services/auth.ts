import { supabase } from './supabase/client';

export const signInWithGoogle = async (returnTo?: string) => {
  const redirectUrl = returnTo
    ? `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}`
    : `${window.location.origin}/auth`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) throw error;
  return data;
};

export const signInWithMagicLink = async (email: string, returnTo?: string) => {
  const redirectUrl = returnTo
    ? `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}`
    : `${window.location.origin}/auth`;

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) throw error;
  return data;
};

export const signUpWithPassword = async (email: string, password: string, returnTo?: string) => {
  const redirectUrl = returnTo
    ? `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}`
    : `${window.location.origin}/auth`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) throw error;
  return data;
};

export const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const resetPassword = async (email: string, returnTo?: string) => {
  const redirectUrl = returnTo
    ? `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}`
    : `${window.location.origin}/auth`;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
