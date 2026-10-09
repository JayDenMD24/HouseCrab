-- HouseCrab: rol admin y revisión obligatoria de pensiones antes de publicarse.
-- Ejecutar en Supabase > SQL Editor (después de los demás archivos).

-- ── 1. Rol admin ─────────────────────────────────────────────────────────────
-- El rol NO se puede asignar desde la app (el cliente no tiene permiso de actualizar `rol`).
alter table public.profiles drop constraint if exists profiles_rol_check;
alter table public.profiles
  add constraint profiles_rol_check check (rol in ('estudiante', 'propietario', 'admin'));

create function public.es_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin');
$$;

-- ── 2. Estado de revisión de cada pensión ────────────────────────────────────
alter table public.pensiones
  add column estado text not null default 'borrador'
    check (estado in ('borrador', 'pendiente', 'aprobada', 'rechazada')),
  add column motivo_rechazo text,
  add column revisada_por uuid references public.profiles (id) on delete set null,
  add column revisada_en timestamptz;

-- Las pensiones que ya estaban publicadas antes de este cambio quedan aprobadas.
update public.pensiones set estado = 'aprobada' where publicada;

-- ── 3. Reglas que la base de datos hace cumplir ──────────────────────────────
create function public.pensiones_control_estado()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- Sin sesión de usuario (SQL Editor / servicio) o admin: sin restricciones.
  if auth.uid() is null or public.es_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.estado := 'borrador';
    new.publicada := false;
    new.motivo_rechazo := null;
    new.revisada_por := null;
    new.revisada_en := null;
    return new;
  end if;

  -- UPDATE hecho por el propietario: no puede tocar los campos de revisión.
  new.motivo_rechazo := old.motivo_rechazo;
  new.revisada_por := old.revisada_por;
  new.revisada_en := old.revisada_en;

  if new.estado is distinct from old.estado then
    -- Lo único que puede hacer es pedir revisión (desde borrador o tras un rechazo).
    if not (new.estado = 'pendiente' and old.estado in ('borrador', 'rechazada')) then
      raise exception 'Cambio de estado no permitido';
    end if;
    new.publicada := false;
    new.motivo_rechazo := null;
  end if;

  -- Cambios en una pensión ya aprobada: vuelve a revisión y se despublica hasta que un admin la apruebe.
  -- (Las habitaciones y sus precios no cuentan: cambian seguido y no definen si la pensión es real.)
  if old.estado = 'aprobada' and new.estado = 'aprobada' and (
       new.nombre is distinct from old.nombre
    or new.tipo is distinct from old.tipo
    or new.direccion is distinct from old.direccion
    or coalesce(new.telefono, '') is distinct from coalesce(old.telefono, '')
    or coalesce(new.comentarios, '') is distinct from coalesce(old.comentarios, '')
    or new.comodidades is distinct from old.comodidades
    or new.dias_alimentacion is distinct from old.dias_alimentacion
    or new.latitud is distinct from old.latitud
    or new.longitud is distinct from old.longitud
    or new.foto_url is distinct from old.foto_url
  ) then
    new.estado := 'pendiente';
    new.publicada := false;
    new.motivo_rechazo := null;
  end if;

  if new.publicada and new.estado <> 'aprobada' then
    raise exception 'La pensión debe ser aprobada por un administrador antes de publicarse';
  end if;

  return new;
end;
$$;

create trigger pensiones_control_estado
  before insert or update on public.pensiones
  for each row execute function public.pensiones_control_estado();

-- ── 4. Visibilidad (RLS) ─────────────────────────────────────────────────────
drop policy "pensiones_select" on public.pensiones;
create policy "pensiones_select" on public.pensiones
  for select using (
    (publicada and estado = 'aprobada') or propietario_id = auth.uid() or public.es_admin()
  );

-- Las habitaciones y reseñas siguen la visibilidad de su pensión (que ya aplica RLS).
drop policy "habitaciones_select" on public.habitaciones;
create policy "habitaciones_select" on public.habitaciones
  for select using (exists (select 1 from public.pensiones p where p.id = pension_id));

drop policy "resenas_select" on public.resenas;
create policy "resenas_select" on public.resenas
  for select using (exists (select 1 from public.pensiones p where p.id = pension_id));

-- ── 5. Funciones del panel de admin ──────────────────────────────────────────
-- Lista pensiones por estado con los datos de contacto del propietario (el correo vive en auth.users,
-- por eso se expone solo a través de esta función, que exige ser admin).
create function public.admin_listar_pensiones(filtro text default 'pendiente')
returns setof jsonb
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  return query
    select to_jsonb(p)
           || jsonb_build_object(
                'propietario_nombre', pr.nombre,
                'propietario_email', u.email,
                'habitaciones', coalesce(
                  (select jsonb_agg(to_jsonb(h)) from public.habitaciones h where h.pension_id = p.id),
                  '[]'::jsonb)
              )
    from public.pensiones p
    join public.profiles pr on pr.id = p.propietario_id
    join auth.users u on u.id = p.propietario_id
    where p.estado = filtro
    order by p.created_at;
end;
$$;

-- Aprueba (y publica) o rechaza una pensión. Se puede revocar una ya aprobada rechazándola.
create function public.admin_revisar_pension(pension uuid, aprobar boolean, motivo text default null)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;
  if not aprobar and (motivo is null or length(trim(motivo)) = 0) then
    raise exception 'Indica el motivo del rechazo';
  end if;

  update public.pensiones
  set estado = case when aprobar then 'aprobada' else 'rechazada' end,
      publicada = aprobar,
      motivo_rechazo = case when aprobar then null else trim(motivo) end,
      revisada_por = auth.uid(),
      revisada_en = now()
  where id = pension and estado in ('pendiente', 'aprobada');

  if not found then
    raise exception 'La pensión no está pendiente de revisión';
  end if;
end;
$$;

revoke all on function public.admin_listar_pensiones(text) from public, anon;
revoke all on function public.admin_revisar_pension(uuid, boolean, text) from public, anon;
grant execute on function public.admin_listar_pensiones(text) to authenticated;
grant execute on function public.admin_revisar_pension(uuid, boolean, text) to authenticated;

-- ── 6. Crear el primer admin ─────────────────────────────────────────────────
-- 1) Regístrate normalmente en la app con el correo que será admin.
-- 2) Ejecuta esto (cambiando el correo) en el SQL Editor:
--
--   update public.profiles set rol = 'admin'
--   where id = (select id from auth.users where email = 'tu-correo@ejemplo.com');
