-- HouseCrab: comentarios públicos en las reseñas + moderación por admin.
-- Ejecutar en Supabase > SQL Editor (después de extras.sql y admin.sql).

alter table public.resenas
  add column comentario text check (comentario is null or length(comentario) <= 1000),
  add column moderada boolean not null default false,
  add column updated_at timestamptz not null default now();

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger resenas_updated_at
  before update on public.resenas
  for each row execute function public.set_updated_at();

-- El autor solo puede cambiar `estrellas` y `comentario`, y no una reseña moderada.
revoke update on public.resenas from authenticated;
grant update (estrellas, comentario) on public.resenas to authenticated;

drop policy "resenas_update" on public.resenas;
create policy "resenas_update" on public.resenas
  for update to authenticated
  using (autor_id = auth.uid() and not moderada)
  with check (autor_id = auth.uid() and not moderada);

drop policy "resenas_insert" on public.resenas;
create policy "resenas_insert" on public.resenas
  for insert to authenticated
  with check (
    autor_id = auth.uid()
    and not moderada
    and exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.rol = 'estudiante')
  );

-- Moderación: el admin elimina el texto de un comentario inapropiado (las estrellas se conservan).
-- Como el comentario es público, se borra de verdad en lugar de solo ocultarlo.
create function public.admin_moderar_resena(resena uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.resenas set comentario = null, moderada = true where id = resena;
end;
$$;

revoke all on function public.admin_moderar_resena(uuid) from public, anon;
grant execute on function public.admin_moderar_resena(uuid) to authenticated;
