-- Run in Supabase → SQL Editor → New Query → Run

create table if not exists feedback (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references auth.users on delete set null,
  type       text not null, -- suggestion | bug | ux | other
  body       text not null,
  created_at timestamptz default now()
);

alter table feedback enable row level security;

-- Users can submit feedback
create policy "insert feedback"
  on feedback for insert
  with check (true);

-- Only the user can see their own submissions
create policy "view own feedback"
  on feedback for select
  using (auth.uid() = user_id);
