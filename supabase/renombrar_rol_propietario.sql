-- HouseCrab: renombra el rol "arrendatario" a "propietario".
-- Ejecutar UNA vez en Supabase > SQL Editor sobre la base de datos que ya existe, y después desplegar la web.
-- (Los demás archivos .sql del repositorio ya usan el valor nuevo, para instalaciones desde cero.)

-- 1. Datos y restricción de la tabla de perfiles.
alter table public.profiles drop constraint if exists profiles_rol_check;
update public.profiles set rol = 'propietario' where rol = 'arrendatario';
alter table public.profiles
  add constraint profiles_rol_check check (rol in ('estudiante', 'propietario', 'admin'));

-- 2. Alta automática del perfil. Acepta también el valor antiguo ('arrendatario') por si algún
--    navegador aún tiene en caché la versión vieja de la web.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nombre, rol, fecha_nacimiento)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'nombre',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    case when new.raw_user_meta_data ->> 'rol' in ('propietario', 'arrendatario') then 'propietario' else 'estudiante' end,
    nullif(new.raw_user_meta_data ->> 'fecha_nacimiento', '')::date
  );
  return new;
end;
$$;

-- 3. Elección de rol al registrarse con Google (también acepta el valor antiguo).
create or replace function public.elegir_rol_inicial(nuevo text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  rol_nuevo text := case when nuevo = 'arrendatario' then 'propietario' else nuevo end;
begin
  if rol_nuevo not in ('estudiante', 'propietario') then
    raise exception 'Rol no válido';
  end if;

  update public.profiles
  set rol = rol_nuevo
  where id = auth.uid()
    and created_at > now() - interval '10 minutes';
end;
$$;

-- 4. Política que permite crear pensiones solo a propietarios.
drop policy "pensiones_insert" on public.pensiones;
create policy "pensiones_insert" on public.pensiones
  for insert to authenticated with check (
    propietario_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'propietario')
  );
