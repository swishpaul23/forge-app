// Supabase client initialization
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log initialization status (dev only)
if (import.meta.env.DEV) {
  console.log("[Forge] Supabase URL:", supabaseUrl ? "✓ loaded" : "✗ MISSING");
  console.log("[Forge] Supabase Key:", supabaseKey ? "✓ loaded" : "✗ MISSING");
}

/**
 * Supabase client instance
 * Will be null if environment variables are not set
 */
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Alias for backwards compatibility
export const sb = supabase;

/**
 * Check if Supabase is configured
 * @returns {boolean}
 */
export const isSupabaseConfigured = () => {
  return supabase !== null;
};
