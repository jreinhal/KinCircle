import { supabase, isSupabaseConfigured } from './supabase';
import { logger } from '../utils/logger';

/**
 * Ensures the current authenticated user is associated with a family.
 * Returns the active family_id for scoping all Supabase reads/writes.
 */
export const ensureFamilyContext = async (): Promise<string> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  let userId = sessionData.session?.user?.id;

  if (!userId) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    userId = data.user?.id || data.session?.user?.id;
  }

  if (!userId) {
    throw new Error('Unable to determine Supabase user id');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) {
    logger.warn('Family membership lookup failed:', membershipError);
  }

  if (membership?.family_id) {
    return membership.family_id;
  }

  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({})
    .select('id')
    .single();

  if (familyError || !family?.id) {
    throw familyError || new Error('Failed to create family');
  }

  const { error: memberError } = await supabase
    .from('family_members')
    .insert({ family_id: family.id, user_id: userId, role: 'ADMIN' });

  if (memberError) {
    throw memberError;
  }

  return family.id;
};
