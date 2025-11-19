import { supabase } from './supabase/client';

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });
  
  if (error) throw error;
  return data;
};

export const signInWithMagicLink = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
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
