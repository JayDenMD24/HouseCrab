-- HouseCrab: respuestas del propietario a las reseñas + reporte de comentarios y respuestas.
-- Ejecutar en Supabase > SQL Editor (después de comentarios.sql).

-- ── 1. Respuesta del propietario (una por reseña) ───────────────────────────
alter table public.resenas
  add column respuesta text check (respuesta is null or length(respuesta) <= 1000),
  add column respuesta_en timestamptz,
  add column respuesta_moderada boolean not null default false;

-- Solo el dueño de la pensión puede responder. Un texto vacío borra la respuesta.
create function public.responder_resena(p_resena uuid, p_texto text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  dueno uuid;
  ya_moderada boolean;
  limpio text := nullif(trim(p_texto), '');
begin
  select p.propietario_id, r.respuesta_moderada
    into dueno, ya_moderada
  from public.resenas r
  join public.pensiones p on p.id = r.pension_id
  where r.id = p_resena;

  if dueno is null or dueno <> auth.uid() then
    raise exception 'Solo el propietario de la pensión puede responder';
  end if;
  if ya_moderada then
    raise exception 'Tu respuesta anterior fue eliminada por moderación y no puedes volver a responder esta reseña';
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

-- ── 2. Reportes ──────────────────────────────────────────────────────────────
create table public.reportes_resena (
  id uuid primary key default gen_random_uuid(),
  resena_id uuid not null references public.resenas (id) on delete cascade,
  tipo text not null check (tipo in ('comentario', 'respuesta')),
  reportante_id uuid not null references public.profiles (id) on delete cascade,
  motivo text not null check (motivo in ('ofensivo', 'spam', 'falso', 'otro')),
  detalle text check (detalle is null or length(detalle) <= 500),
  estado text not null default 'abierto' check (estado in ('abierto', 'resuelto', 'descartado')),
  created_at timestamptz not null default now(),
  resuelto_por uuid references public.profiles (id) on delete set null,
  resuelto_en timestamptz,
  unique (resena_id, tipo, reportante_id)
);

-- Sin políticas ni permisos directos: solo se accede mediante las funciones de abajo.
alter table public.reportes_resena enable row level security;
revoke all on public.reportes_resena from anon, authenticated;

create function public.reportar_resena(p_resena uuid, p_tipo text, p_motivo text, p_detalle text default null)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  autor uuid;
  dueno uuid;
  contenido text;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión';
  end if;
  if p_tipo not in ('comentario', 'respuesta') then
    raise exception 'Tipo no válido';
  end if;

  -- Solo se pueden reportar reseñas de pensiones publicadas.
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
end;
$$;

-- ── 3. Funciones del admin ───────────────────────────────────────────────────
create function public.admin_listar_reportes(filtro text default 'abierto')
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
             'contenido', case when rp.tipo = 'comentario' then r.comentario else r.respuesta end,
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

-- Resuelve un reporte: elimina el contenido o lo descarta. Afecta a todos los reportes abiertos del mismo contenido.
create function public.admin_resolver_reporte(reporte uuid, eliminar boolean)
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

  if eliminar then
    if rp.tipo = 'comentario' then
      update public.resenas set comentario = null, moderada = true where id = rp.resena_id;
    else
      update public.resenas set respuesta = null, respuesta_en = null, respuesta_moderada = true where id = rp.resena_id;
    end if;
  end if;

  update public.reportes_resena
  set estado = case when eliminar then 'resuelto' else 'descartado' end,
      resuelto_por = auth.uid(),
      resuelto_en = now()
  where resena_id = rp.resena_id and tipo = rp.tipo and estado = 'abierto';
end;
$$;

-- Moderación directa desde la reseña (sin pasar por un reporte). Cierra los reportes abiertos del contenido.
create or replace function public.admin_moderar_resena(resena uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.resenas set comentario = null, moderada = true where id = resena;
  update public.reportes_resena
  set estado = 'resuelto', resuelto_por = auth.uid(), resuelto_en = now()
  where resena_id = resena and tipo = 'comentario' and estado = 'abierto';
end;
$$;

create function public.admin_moderar_respuesta(resena uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  update public.resenas set respuesta = null, respuesta_en = null, respuesta_moderada = true where id = resena;
  update public.reportes_resena
  set estado = 'resuelto', resuelto_por = auth.uid(), resuelto_en = now()
  where resena_id = resena and tipo = 'respuesta' and estado = 'abierto';
end;
$$;

revoke all on function public.responder_resena(uuid, text) from public, anon;
revoke all on function public.reportar_resena(uuid, text, text, text) from public, anon;
revoke all on function public.admin_listar_reportes(text) from public, anon;
revoke all on function public.admin_resolver_reporte(uuid, boolean) from public, anon;
revoke all on function public.admin_moderar_respuesta(uuid) from public, anon;
grant execute on function public.responder_resena(uuid, text) to authenticated;
grant execute on function public.reportar_resena(uuid, text, text, text) to authenticated;
grant execute on function public.admin_listar_reportes(text) to authenticated;
grant execute on function public.admin_resolver_reporte(uuid, boolean) to authenticated;
grant execute on function public.admin_moderar_respuesta(uuid) to authenticated;
