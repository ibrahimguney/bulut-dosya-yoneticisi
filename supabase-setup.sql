insert into storage.buckets (id, name, public, file_size_limit)
values ('files', 'files', false, 104857600)
on conflict (id) do nothing;

create policy "Users can list their own files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload their own files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'files'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

alter table public.folders enable row level security;

create policy "Users can read their own folders"
on public.folders
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can create their own folders"
on public.folders
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own folders"
on public.folders
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own folders"
on public.folders
for delete
to authenticated
using (user_id = auth.uid());
