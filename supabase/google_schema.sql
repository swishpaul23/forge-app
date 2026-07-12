-- Run in Supabase → SQL Editor → New Query → Run
-- Google Calendar + Google Tasks sync

-- OAuth tokens, one row per user. Kept in a dedicated table (rather than on
-- profiles, like the Strava integration does) so RLS can scope access to
-- these credentials independently of the rest of the profile row.
create table if not exists google_tokens (
  user_id        uuid references profiles(id) on delete cascade primary key,
  access_token   text not null,
  refresh_token  text not null,
  expires_at     timestamptz not null,
  google_email   text,
  last_synced_at timestamptz,
  updated_at     timestamptz default now()
);
alter table google_tokens enable row level security;
drop policy if exists "users own tokens" on google_tokens;
create policy "users own tokens" on google_tokens for all using (auth.uid() = user_id);

-- Link time_blocks to GCal events
alter table time_blocks add column if not exists gcal_event_id text;

-- Link challenges to a Google Tasks list, and challenge_tasks to individual
-- Google Tasks within that list (list id lives on the challenge, not
-- repeated on every task row).
alter table challenges add column if not exists gtask_list_id text;
alter table challenge_tasks add column if not exists gtask_id text;
