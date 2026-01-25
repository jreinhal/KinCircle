import { supabase, isSupabaseConfigured } from './supabase';
import { logger } from '../utils/logger';

type SupabaseAuthMode = 'none' | 'anonymous';

const rawAuthMode = (import.meta.env.VITE_SUPABASE_AUTH_MODE || 'none').toLowerCase();
const authMode: SupabaseAuthMode = rawAuthMode === 'anonymous' ? 'anonymous' : 'none';

export const initSupabaseAuth = async (): Promise<void> => {
  if (!isSupabaseConfigured || authMode === 'none') {
    return;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) return;

    if (authMode === 'anonymous') {
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) throw anonError;
    }
  } catch (error) {
    logger.warn('Supabase auth initialization failed:', error);
  }
};

export const getSupabaseAuthMode = (): SupabaseAuthMode => authMode;
