-- Public project icons. Uploads are restricted to the owning project user.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-icons',
  'project-icons',
  true,
  4194304,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 4194304,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

drop policy if exists project_icons_owner_insert on storage.objects;
create policy project_icons_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-icons'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.projects p
    where p.id::text = (storage.foldername(name))[2]
      and p.deleted_at is null
      and coalesce(p.owner_id, p.created_by) = auth.uid()
      and public.is_workspace_member(p.workspace_id)
  )
);

drop policy if exists project_icons_owner_delete on storage.objects;
create policy project_icons_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'project-icons'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.projects p
    where p.id::text = (storage.foldername(name))[2]
      and coalesce(p.owner_id, p.created_by) = auth.uid()
  )
);
