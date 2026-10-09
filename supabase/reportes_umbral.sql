-- HouseCrab: ocultar automáticamente un comentario o respuesta al acumular reportes.
-- Ejecutar en Supabase > SQL Editor (después de respuestas_reportes.sql).

-- Número de reportes abiertos a partir del cual el contenido se oculta hasta que un admin decida.
-- Para cambiarlo: create or replace function public.umbral_reportes() ... 'select 8'
create or replace function public.umbral_reportes()
returns int
language sql
immutable
as 'select 5';

alter table public.resenas
  add column comentario_en_revision boolean not null default false,
  add column respuesta_en_revision boolean not null default false,
  -- Texto retenido mientras el contenido está oculto. Los usuarios NO pueden leer estas dos columnas.
  add column comentario_oculto text,
  add column respuesta_oculta text;

-- Los textos retenidos no se pueden leer desde la API: se concede SELECT solo sobre el resto de columnas.
revoke select on public.resenas from anon, authenticated;
grant select (
  id, pension_id, autor_id, estrellas, created_at,
  comentario, moderada, updated_at,
  respuesta, respuesta_en, respuesta_moderada,
  comentario_en_revision, respuesta_en_revision
) on public.resenas to anon, authenticated;

-- El autor no puede editar su reseña mientras su comentario está en revisión.
drop policy "resenas_update" on public.resenas;
create policy "resenas_update" on public.resenas
  for update to authenticated
  using (autor_id = auth.uid() and not moderada and not comentario_en_revision)
  with check (autor_id = auth.uid() and not moderada and not comentario_en_revision);

-- El propietario no puede editar su respuesta mientras está en revisión.
create or replace function public.responder_resena(p_resena uuid, p_texto text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  dueno uuid;
  ya_moderada boolean;
  en_revision boolean;
  limpio text := nullif(trim(p_texto), '');
begin
  select p.propietario_id, r.respuesta_moderada, r.respuesta_en_revision
    into dueno, ya_moderada, en_revision
  from public.resenas r
  join public.pensiones p on p.id = r.pension_id
  where r.id = p_resena;

  if dueno is null or dueno <> auth.uid() then
    raise exception 'Solo el propietario de la pensión puede responder';
  end if;
  if ya_moderada then
    raise exception 'Tu respuesta anterior fue eliminada por moderación y no puedes volver a responder esta reseña';
  end if;
  if en_revision then
    raise exception 'Tu respuesta está en revisión por reportes; un administrador decidirá';
  end if;
  if length(limpio) > 1000 then
    raise exception 'La respuesta no puede superar los 1000 caracteres';
  end if;

  update public.resenas
  set respuesta = limpio,
      respuesta_en = case when limpio is null then null else now() end
  where id = p_resena;
end;
$$;

-- Al reportar: si se alcanza el umbral, el contenido se oculta (su texto se retiene para el admin).
create or replace function public.reportar_resena(p_resena uuid, p_tipo text, p_motivo text, p_detalle text default null)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  autor uuid;
  dueno uuid;
  contenido text;
  abiertos int;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión';
  end if;
  if p_tipo not in ('comentario', 'respuesta') then
    raise exception 'Tipo no válido';
  end if;

  select r.autor_id, p.propietario_id, case when p_tipo = 'comentario' then r.comentario else r.respuesta end
    into autor, dueno, contenido
  from public.resenas r
  join public.pensiones p on p.id = r.pension_id
  where r.id = p_resena and p.publicada and p.estado = 'aprobada';

  if contenido is null then
    raise exception 'No hay contenido que reportar';
  end if;
  if (p_tipo = 'comentario' and autor = auth.uid()) or (p_tipo = 'respuesta' and dueno = auth.uid()) then
    raise exception 'No puedes reportar tu propio contenido';
  end if;
  if exists (select 1 from public.reportes_resena
             where resena_id = p_resena and tipo = p_tipo and reportante_id = auth.uid()) then
    raise exception 'Ya reportaste este contenido';
  end if;

  insert into public.reportes_resena (resena_id, tipo, reportante_id, motivo, detalle)
  values (p_resena, p_tipo, auth.uid(), p_motivo, nullif(trim(p_detalle), ''));

  select count(*) into abiertos
  from public.reportes_resena
  where resena_id = p_resena and tipo = p_tipo and estado = 'abierto';

  if abiertos >= public.umbral_reportes() then
    if p_tipo = 'comentario' then
      update public.resenas
      set comentario_oculto = comentario, comentario = null, comentario_en_revision = true
      where id = p_resena and not comentario_en_revision;
    else
      update public.resenas
      set respuesta_oculta = respuesta, respuesta = null, respuesta_en = null, respuesta_en_revision = true
      where id = p_resena and not respuesta_en_revision;
    end if;
  end if;
end;
$$;

-- El admin ve el texto aunque esté oculto, y si fue ocultado automáticamente.
create or replace function public.admin_listar_reportes(filtro text default 'abierto')
returns setof jsonb
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  return query
    select jsonb_build_object(
             'id', rp.id,
             'resena_id', rp.resena_id,
             'tipo', rp.tipo,
             'motivo', rp.motivo,
             'detalle', rp.detalle,
             'estado', rp.estado,
             'created_at', rp.created_at,
             'estrellas', r.estrellas,
             'contenido', case when rp.tipo = 'comentario'
                               then coalesce(r.comentario, r.comentario_oculto)
                               else coalesce(r.respuesta, r.respuesta_oculta) end,
             'oculto', case when rp.tipo = 'comentario' then r.comentario_en_revision else r.respuesta_en_revision end,
             'umbral', public.umbral_reportes(),
             'pension_nombre', p.nombre,
             'autor_nombre', case when rp.tipo = 'comentario' then au.nombre else dp.nombre end,
             'reportante_nombre', rep.nombre,
             'reportes_del_mismo_contenido', (
               select count(*) from public.reportes_resena x
               where x.resena_id = rp.resena_id and x.tipo = rp.tipo)
           )
    from public.reportes_resena rp
    join public.resenas r on r.id = rp.resena_id
    join public.pensiones p on p.id = r.pension_id
    join public.profiles au on au.id = r.autor_id
    join public.profiles dp on dp.id = p.propietario_id
    join public.profiles rep on rep.id = rp.reportante_id
    where rp.estado = filtro
    order by rp.created_at;
end;
$$;

-- Eliminar borra el contenido de forma definitiva; descartar lo restaura si estaba oculto.
create or replace function public.admin_resolver_reporte(reporte uuid, eliminar boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  rp public.reportes_resena;
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  select * into rp from public.reportes_resena where id = reporte and estado = 'abierto';
  if not found then
    raise exception 'El reporte no existe o ya fue resuelto';
  end if;

  if rp.tipo = 'comentario' then
    if eliminar then
      update public.resenas
      set comentario = null, comentario_oculto = null, comentario_en_revision = false, moderada = true
      where id = rp.resena_id;
    else
      update public.resenas
      set comentario = coalesce(comentario, comentario_oculto), comentario_oculto = null, comentario_en_revision = false
      where id = rp.resena_id;
    end if;
  else
    if eliminar then
      update public.resenas
      set respuesta = null, respuesta_en = null, respuesta_oculta = null,
          respuesta_en_revision = false, respuesta_moderada = true
      where id = rp.resena_id;
    else
      update public.resenas
      set respuesta = coalesce(respuesta, respuesta_oculta), respuesta_oculta = null, respuesta_en_revision = false
      where id = rp.resena_id;
    end if;
  end if;

  update public.reportes_resena
  set estado = case when eliminar then 'resuelto' else 'descartado' end,
      resuelto_por = auth.uid(),
      resuelto_en = now()
  where resena_id = rp.resena_id and tipo = rp.tipo and estado = 'abierto';
end;
$$;

-- Moderación directa del admin: limpia también el texto retenido.
create or replace function public.admin_moderar_resena(resena uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.resenas
  set comentario = null, comentario_oculto = null, comentario_en_revision = false, moderada = true
  where id = resena;
  update public.reportes_resena
  set estado = 'resuelto', resuelto_por = auth.uid(), resuelto_en = now()
  where resena_id = resena and tipo = 'comentario' and estado = 'abierto';
end;
$$;

create or replace function public.admin_moderar_respuesta(resena uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.resenas
  set respuesta = null, respuesta_en = null, respuesta_oculta = null,
      respuesta_en_revision = false, respuesta_moderada = true
  where id = resena;
  update public.reportes_resena
  set estado = 'resuelto', resuelto_por = auth.uid(), resuelto_en = now()
  where resena_id = resena and tipo = 'respuesta' and estado = 'abierto';
end;
$$;
