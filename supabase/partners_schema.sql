-- Run this in Supabase → SQL Editor → New Query → Run
-- Accountability Partners System

-- ─── PARTNERSHIPS ────────────────────────────────────────────
create table if not exists partnerships (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references auth.users on delete cascade not null,
  partner_id   uuid references auth.users on delete cascade not null,
  invite_code  text unique not null,
  status       text default 'pending', -- pending | active | declined
  created_at   timestamptz default now(),
  unique(user_id, partner_id)
);
alter table partnerships enable row level security;
create policy "see own partnerships"
  on partnerships for select
  using (auth.uid() = user_id or auth.uid() = partner_id);
create policy "create partnerships"
  on partnerships for insert
  with check (auth.uid() = user_id);
create policy "update partnerships"
  on partnerships for update
  using (auth.uid() = user_id or auth.uid() = partner_id);
create policy "delete partnerships"
  on partnerships for delete
  using (auth.uid() = user_id or auth.uid() = partner_id);

-- ─── PARTNER REACTIONS ───────────────────────────────────────
create table if not exists partner_reactions (
  id           uuid default uuid_generate_v4() primary key,
  from_user_id uuid references auth.users on delete cascade not null,
  to_user_id   uuid references auth.users on delete cascade not null,
  emoji        text not null,  -- 🔥 ✓ 💪
  created_at   timestamptz default now()
);
alter table partner_reactions enable row level security;
create policy "see own reactions"
  on partner_reactions for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "send reactions"
  on partner_reactions for insert
  with check (auth.uid() = from_user_id);

-- ─── PARTNER MESSAGES ────────────────────────────────────────
create table if not exists partner_messages (
  id           uuid default uuid_generate_v4() primary key,
  from_user_id uuid references auth.users on delete cascade not null,
  to_user_id   uuid references auth.users on delete cascade not null,
  body         text not null,
  read         boolean default false,
  created_at   timestamptz default now()
);
alter table partner_messages enable row level security;
create policy "see own messages"
  on partner_messages for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "send messages"
  on partner_messages for insert
  with check (auth.uid() = from_user_id);
create policy "mark read"
  on partner_messages for update
  using (auth.uid() = to_user_id);

-- ─── Add invite_code to profiles ─────────────────────────────
alter table profiles add column if not exists invite_code text unique;
alter table profiles add column if not exists username text;

-- Auto-generate invite code for existing + new users
create or replace function generate_invite_code()
returns trigger language plpgsql as $$
begin
  if new.invite_code is null then
    new.invite_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  end if;
  return new;
end;
$$;
drop trigger if exists set_invite_code on profiles;
create trigger set_invite_code
  before insert on profiles
  for each row execute procedure generate_invite_code();

-- Backfill invite codes for existing profiles
update profiles set invite_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where invite_code is null;
