import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from './supabase';

export type { Database, User };
export type SupabaseClientType = SupabaseClient<Database>;

// TEMPORARY: google_tokens / gcal_event_id / gtask_list_id / gtask_id are
// added by supabase/google_schema.sql, which hasn't been applied to the DB
// yet, so the generated Database type above doesn't know about them. Used
// to narrowly opt out of that generic only at call sites touching those
// columns/tables (useGoogleSync.ts, useTimeBlocks.tsx). Delete this once the
// migration is applied and supabase.ts is regenerated.
export type SupabaseClientUntyped = SupabaseClient<any>;
