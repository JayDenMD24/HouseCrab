-- HouseCrab: esquema inicial. Ejecutar completo en Supabase > SQL Editor.

-- ── Perfiles (uno por usuario de auth) ───────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol text not null default 'estudiante' check (rol in ('estudiante', 'propietario')),
  fecha_nacimiento date,
  created_at timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse.
-- Los datos llegan en options.data de supabase.auth.signUp().
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nombre, rol, fecha_nacimiento)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'rol' = 'propietario' then 'propietario' else 'estudiante' end,
    nullif(new.raw_user_meta_data ->> 'fecha_nacimiento', '')::date
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Pensiones ────────────────────────────────────────────────────────────────
create table public.pensiones (
  id uuid primary key default gen_random_uuid(),
  propietario_id uuid not null references public.profiles (id) on delete cascade,
  nombre text not null,
  tipo text not null,                       -- p. ej. 'Casa familiar'
  direccion text not null,
  telefono text,
  comentarios text,
  comodidades text[] not null default '{}', -- p. ej. {'Aire acondicionado','Lavado'}
  dias_alimentacion text[] not null default '{}', -- p. ej. {'lunes','martes'}
  latitud double precision not null,
  longitud double precision not null,
  foto_url text,
  publicada boolean not null default false,
  created_at timestamptz not null default now()
);

create index pensiones_propietario_idx on public.pensiones (propietario_id);

-- ── Habitaciones ─────────────────────────────────────────────────────────────
create table public.habitaciones (
  id uuid primary key default gen_random_uuid(),
  pension_id uuid not null references public.pensiones (id) on delete cascade,
  tipo_cama text,
  cantidad_personas int not null default 1 check (cantidad_personas > 0),
  precio numeric(12, 0) not null check (precio >= 0),
  foto_url text,
  created_at timestamptz not null default now()
);

create index habitaciones_pension_idx on public.habitaciones (pension_id);

-- ── Seguridad (RLS) ──────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.pensiones enable row level security;
alter table public.habitaciones enable row level security;

-- profiles: cualquier usuario autenticado puede ver nombres (para chats); solo edita el suyo.
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- El rol no se puede cambiar desde el cliente.
revoke update on public.profiles from authenticated;
grant update (nombre, fecha_nacimiento) on public.profiles to authenticated;

-- pensiones: todos ven las publicadas; el dueño ve y gestiona las suyas.
create policy "pensiones_select" on public.pensiones
  for select using (publicada or propietario_id = auth.uid());
create policy "pensiones_insert" on public.pensiones
  for insert to authenticated with check (
    propietario_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'propietario')
  );
create policy "pensiones_update" on public.pensiones
  for update to authenticated using (propietario_id = auth.uid()) with check (propietario_id = auth.uid());
create policy "pensiones_delete" on public.pensiones
  for delete to authenticated using (propietario_id = auth.uid());

-- habitaciones: visibles si la pensión es visible; solo el dueño las modifica.
create policy "habitaciones_select" on public.habitaciones
  for select using (
    exists (select 1 from public.pensiones p
            where p.id = pension_id and (p.publicada or p.propietario_id = auth.uid()))
  );
create policy "habitaciones_write" on public.habitaciones
  for all to authenticated
  using (exists (select 1 from public.pensiones p where p.id = pension_id and p.propietario_id = auth.uid()))
  with check (exists (select 1 from public.pensiones p where p.id = pension_id and p.propietario_id = auth.uid()));
