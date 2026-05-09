create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text,
  status text not null default 'open' check (status in ('open', 'done')),
  due_at timestamptz,
  reminder_at timestamptz,
  priority integer not null default 1 check (priority between 0 and 3),
  repeat_rule jsonb not null default '{"type":"none"}'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  completed_at timestamptz,
  deleted_at timestamptz,
  device_id text not null,
  version integer not null default 1
);

create table if not exists public.tags (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  unique (user_id, name)
);

create table if not exists public.task_tags (
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null references public.tasks(id) on delete cascade,
  tag_id text not null references public.tags(id) on delete cascade,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, task_id, tag_id)
);

create table if not exists public.sync_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  last_pulled_at timestamptz not null default '1970-01-01T00:00:00Z',
  last_pushed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, device_id)
);

create index if not exists tasks_user_updated_idx on public.tasks (user_id, updated_at);
create index if not exists tasks_user_deleted_idx on public.tasks (user_id, deleted_at);
create index if not exists tags_user_updated_idx on public.tags (user_id, updated_at);
create index if not exists task_tags_user_updated_idx on public.task_tags (user_id, updated_at);

alter table public.tasks enable row level security;
alter table public.tags enable row level security;
alter table public.task_tags enable row level security;
alter table public.sync_state enable row level security;

create policy "Users can read own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own tags"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "Users can insert own tags"
  on public.tags for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tags"
  on public.tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own task tags"
  on public.task_tags for select
  using (auth.uid() = user_id);

create policy "Users can insert own task tags"
  on public.task_tags for insert
  with check (auth.uid() = user_id);

create policy "Users can update own task tags"
  on public.task_tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own sync state"
  on public.sync_state for select
  using (auth.uid() = user_id);

create policy "Users can upsert own sync state"
  on public.sync_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
