import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
    console.warn('Supabase URL or Anon Key is missing. Check your .env.local file.');
}

const createSupabaseStub = () => {
    const error = new Error('Supabase is not configured');
    const response = Promise.resolve({ data: null, error });
    const chain: any = {
        select: () => chain,
        upsert: () => response,
        delete: () => response,
        single: () => response,
        eq: () => chain,
        then: response.then.bind(response),
        catch: response.catch.bind(response),
        finally: response.finally.bind(response)
    };

    return {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            signInAnonymously: async () => ({ data: { session: null }, error })
        },
        from: () => chain
    };
};

/**
 * Global Supabase Client
 * Use this to interact with the database.
 */
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : createSupabaseStub();
