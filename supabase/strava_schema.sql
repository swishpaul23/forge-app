-- Run in Supabase → SQL Editor → New Query → Run

alter table profiles add column if not exists strava_access_token  text;
alter table profiles add column if not exists strava_refresh_token text;
alter table profiles add column if not exists strava_token_expiry  timestamptz;
alter table profiles add column if not exists strava_athlete_id    text;
alter table profiles add column if not exists strava_athlete_name  text;

-- Remove github columns if they exist
alter table profiles drop column if exists github_username;
alter table profiles drop column if exists github_token;
