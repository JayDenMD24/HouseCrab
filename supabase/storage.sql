-- HouseCrab: fotos de pensiones y habitaciones. Ejecutar en Supabase > SQL Editor.

-- Bucket público (las URLs de las fotos se pueden ver sin sesión), máx. 5 MB, solo imágenes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pensiones', 'pensiones', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Cada usuario solo puede subir y borrar archivos dentro de su propia carpeta: <user_id>/...
create policy "fotos_insert_propias" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pensiones' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fotos_delete_propias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pensiones' and (storage.foldername(name))[1] = auth.uid()::text);
