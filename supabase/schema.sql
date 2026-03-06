-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run

create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id         uuid references auth.users on delete cascade primary key,
  full_name  text,
  theme      text default 'forge',
  tone       text default 'Coach',
  onboarded  boolean default false,
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "own profile" on profiles for all using (auth.uid() = id);

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure handle_new_user();

create table if not exists challenges (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references auth.users on delete cascade not null,
  name         text not null,
  tag          text default 'CUSTOM',
  total_days   integer not null,
  day_num      integer default 1,
  streak       integer default 0,
  consistency  integer default 100,
  color        text default '#9A9690',
  mission      text,
  is_main      boolean default false,
  archived     boolean default false,
  completed_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table challenges enable row level security;
create policy "own challenges" on challenges for all using (auth.uid() = user_id);

create table if not exists challenge_tasks (
  id           uuid default uuid_generate_v4() primary key,
  challenge_id uuid references challenges on delete cascade not null,
  key          text not null,
  label        text not null,
  cat          text default 'other',
  non_neg      boolean default false,
  sort_order   integer default 0
);
alter table challenge_tasks enable row level security;
create policy "own tasks" on challenge_tasks for all
  using (exists (select 1 from challenges where challenges.id = challenge_tasks.challenge_id and challenges.user_id = auth.uid()));

create table if not exists checkins (
  id             uuid default uuid_generate_v4() primary key,
  challenge_id   uuid references challenges on delete cascade not null,
  date           date not null,
  score          integer default 0,
  completed_keys jsonb default '[]',
  updated_at     timestamptz default now(),
  unique(challenge_id, date)
);
alter table checkins enable row level security;
create policy "own checkins" on checkins for all
  using (exists (select 1 from challenges where challenges.id = checkins.challenge_id and challenges.user_id = auth.uid()));
