-- HouseCrab: reseñas (estrellas), mensajes a soporte, eliminar cuenta y registro con Google.
-- Ejecutar en Supabase > SQL Editor (después de schema.sql, chat.sql y storage.sql).

-- ── Reseñas: una calificación (1-5) por estudiante y pensión ────────────────
create table public.resenas (
  id uuid primary key default gen_random_uuid(),
  pension_id uuid not null references public.pensiones (id) on delete cascade,
  autor_id uuid not null references public.profiles (id) on delete cascade,
  estrellas smallint not null check (estrellas between 1 and 5),
  created_at timestamptz not null default now(),
  unique (pension_id, autor_id)
);

alter table public.resenas enable row level security;

-- Las calificaciones de pensiones publicadas son visibles para todos.
create policy "resenas_select" on public.resenas
  for select using (
    exists (select 1 from public.pensiones p where p.id = pension_id and (p.publicada or p.propietario_id = auth.uid()))
  );

-- Solo estudiantes califican, y una sola vez por pensión (luego pueden cambiarla).
create policy "resenas_insert" on public.resenas
  for insert to authenticated
  with check (
    autor_id = auth.uid()
    and exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.rol = 'estudiante')
  );
create policy "resenas_update" on public.resenas
  for update to authenticated using (autor_id = auth.uid()) with check (autor_id = auth.uid());

-- ── Soporte: mensajes de los usuarios al equipo ──────────────────────────────
create table public.soporte (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  mensaje text not null check (length(trim(mensaje)) > 0 and length(mensaje) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.soporte enable row level security;

create policy "soporte_insert" on public.soporte
  for insert to authenticated with check (usuario_id = auth.uid());
create policy "soporte_select_propios" on public.soporte
  for select to authenticated using (usuario_id = auth.uid());

-- ── Eliminar la cuenta propia (borra auth.users; el resto cae en cascada) ─────
create function public.eliminar_mi_cuenta()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.eliminar_mi_cuenta() from public, anon;
grant execute on function public.eliminar_mi_cuenta() to authenticated;

-- ── Perfil automático: también toma el nombre que entrega Google ────────────
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
    case when new.raw_user_meta_data ->> 'rol' = 'arrendatario' then 'arrendatario' else 'estudiante' end,
    nullif(new.raw_user_meta_data ->> 'fecha_nacimiento', '')::date
  );
  return new;
end;
$$;
