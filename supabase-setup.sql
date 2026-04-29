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
