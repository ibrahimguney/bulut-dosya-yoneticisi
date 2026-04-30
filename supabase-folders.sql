create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

alter table public.folders enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'folders'
      and policyname = 'Users can read their own folders'
  ) then
    create policy "Users can read their own folders"
    on public.folders
    for select
    to authenticated
    using (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'folders'
      and policyname = 'Users can create their own folders'
  ) then
    create policy "Users can create their own folders"
    on public.folders
    for insert
    to authenticated
    with check (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'folders'
      and policyname = 'Users can update their own folders'
  ) then
    create policy "Users can update their own folders"
    on public.folders
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'folders'
      and policyname = 'Users can delete their own folders'
  ) then
    create policy "Users can delete their own folders"
    on public.folders
    for delete
    to authenticated
    using (user_id = auth.uid());
  end if;
end $$;
