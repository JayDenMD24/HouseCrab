-- HouseCrab: editar una pensión aprobada la devuelve a revisión.
-- Ejecutar en Supabase > SQL Editor si ya habías corrido admin.sql (reemplaza la función del trigger).

create or replace function public.pensiones_control_estado()
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
