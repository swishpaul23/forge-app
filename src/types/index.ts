import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from './supabase';

export type { Database, User };
export type SupabaseClientType = SupabaseClient<Database>;
