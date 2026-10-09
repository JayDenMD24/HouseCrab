-- HouseCrab: permite elegir el rol al registrarse con Google. Ejecutar en Supabase > SQL Editor.
-- Solo funciona durante los primeros 10 minutos de vida de la cuenta.

create function public.elegir_rol_inicial(nuevo text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if nuevo not in ('estudiante', 'propietario') then
    raise exception 'Rol no válido';
  end if;

  update public.profiles
  set rol = nuevo
  where id = auth.uid()
    and created_at > now() - interval '10 minutes';
end;
$$;

revoke all on function public.elegir_rol_inicial(text) from public, anon;
grant execute on function public.elegir_rol_inicial(text) to authenticated;
