-- HouseCrab: chat estudiante <-> arrendatario. Ejecutar en Supabase > SQL Editor (después de schema.sql).

-- Una conversación por (pensión, estudiante).
create table public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  pension_id uuid not null references public.pensiones (id) on delete cascade,
  estudiante_id uuid not null references public.profiles (id) on delete cascade,
  propietario_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (pension_id, estudiante_id)
);

create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.conversaciones (id) on delete cascade,
  autor_id uuid not null references public.profiles (id) on delete cascade,
  texto text not null check (length(trim(texto)) > 0 and length(texto) <= 2000),
  leido boolean not null default false,
  created_at timestamptz not null default now()
);

create index mensajes_conversacion_idx on public.mensajes (conversacion_id, created_at);

alter table public.conversaciones enable row level security;
alter table public.mensajes enable row level security;

-- Conversaciones: solo las ven sus dos participantes.
create policy "conversaciones_select" on public.conversaciones
  for select to authenticated
  using (auth.uid() in (estudiante_id, propietario_id));

-- Solo un estudiante la crea, y el propietario debe ser el dueño real de la pensión.
create policy "conversaciones_insert" on public.conversaciones
  for insert to authenticated
  with check (
    estudiante_id = auth.uid()
    and exists (select 1 from public.pensiones p
                where p.id = pension_id and p.propietario_id = conversaciones.propietario_id)
  );

-- Mensajes: leer y escribir solo en conversaciones propias.
create policy "mensajes_select" on public.mensajes
  for select to authenticated
  using (exists (select 1 from public.conversaciones c
                 where c.id = conversacion_id and auth.uid() in (c.estudiante_id, c.propietario_id)));

create policy "mensajes_insert" on public.mensajes
  for insert to authenticated
  with check (
    autor_id = auth.uid()
    and exists (select 1 from public.conversaciones c
                where c.id = conversacion_id and auth.uid() in (c.estudiante_id, c.propietario_id))
  );

-- Marcar como leídos los mensajes del otro (solo se puede cambiar la columna `leido`).
create policy "mensajes_marcar_leido" on public.mensajes
  for update to authenticated
  using (autor_id <> auth.uid()
         and exists (select 1 from public.conversaciones c
                     where c.id = conversacion_id and auth.uid() in (c.estudiante_id, c.propietario_id)))
  with check (autor_id <> auth.uid());
revoke update on public.mensajes from authenticated;
grant update (leido) on public.mensajes to authenticated;

-- Tiempo real para los mensajes nuevos.
alter publication supabase_realtime add table public.mensajes;
