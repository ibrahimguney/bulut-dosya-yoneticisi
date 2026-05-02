create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  meta jsonb not null default '{}'::jsonb,
  share_id text unique,
  created_at timestamptz not null default now()
);

alter table public.materials
add column if not exists share_id text unique;

alter table public.materials enable row level security;

drop policy if exists "Users can read own materials" on public.materials;
create policy "Users can read own materials"
on public.materials for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Anyone can read shared materials" on public.materials;
create policy "Anyone can read shared materials"
on public.materials for select
to anon, authenticated
using (share_id is not null);

drop policy if exists "Users can insert own materials" on public.materials;
create policy "Users can insert own materials"
on public.materials for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own materials" on public.materials;
create policy "Users can update own materials"
on public.materials for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own materials" on public.materials;
create policy "Users can delete own materials"
on public.materials for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists materials_user_created_idx
on public.materials (user_id, created_at desc);

create index if not exists materials_share_idx
on public.materials (share_id)
where share_id is not null;

create unique index if not exists materials_share_unique_idx
on public.materials (share_id)
where share_id is not null;
