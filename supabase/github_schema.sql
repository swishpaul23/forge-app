-- Run in Supabase → SQL Editor → New Query → Run

alter table profiles add column if not exists github_username text;
alter table profiles add column if not exists github_token    text;
