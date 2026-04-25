-- ============================================================
-- MI MUNDO DE APRENDIZAJE — Schema de base de datos
-- Ejecutar en: Supabase → SQL Editor → New Query
-- ============================================================

-- EXTENSIONES
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: perfiles (extiende auth.users de Supabase)
-- ============================================================
create table public.perfiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  rol          text not null check (rol in ('estudiante','padre','docente','especialista')),
  nombre       text not null,
  apodo        text,
  avatar       text default '🐻',
  pin_hash     text,                        -- solo estudiantes
  codigo_salon text,                        -- salon al que pertenece
  created_at   timestamptz default now()
);

-- ============================================================
-- TABLA: salones
-- ============================================================
create table public.salones (
  id           uuid default uuid_generate_v4() primary key,
  nombre       text not null,
  codigo       text unique not null,        -- ej: HELADO7
  docente_id   uuid references public.perfiles(id),
  activo       boolean default true,
  created_at   timestamptz default now()
);

-- ============================================================
-- TABLA: progreso_estudiante
-- ============================================================
create table public.progreso (
  id             uuid default uuid_generate_v4() primary key,
  estudiante_id  uuid references public.perfiles(id) on delete cascade,
  materia        text not null check (materia in ('matematica','ingles','lectura','arte','tecnologia','deportes')),
  actividad      text not null,
  puntos         integer default 0,
  completado     boolean default false,
  datos_extra    jsonb default '{}',        -- detalles específicos del juego
  created_at     timestamptz default now()
);

-- ============================================================
-- TABLA: publicaciones (muro creativo + café)
-- ============================================================
create table public.publicaciones (
  id           uuid default uuid_generate_v4() primary key,
  autor_id     uuid references public.perfiles(id) on delete cascade,
  espacio      text not null check (espacio in ('creatividad','cafe','vivencias')),
  tipo         text not null check (tipo in ('texto','imagen','video','audio','cuento')),
  titulo       text,
  contenido    text,
  url_media    text,
  aprobado     boolean default false,       -- moderación obligatoria para menores
  likes        integer default 0,
  created_at   timestamptz default now()
);

-- ============================================================
-- TABLA: comentarios
-- ============================================================
create table public.comentarios (
  id              uuid default uuid_generate_v4() primary key,
  publicacion_id  uuid references public.publicaciones(id) on delete cascade,
  autor_id        uuid references public.perfiles(id) on delete cascade,
  texto           text not null,
  aprobado        boolean default false,
  created_at      timestamptz default now()
);

-- ============================================================
-- TABLA: notificaciones
-- ============================================================
create table public.notificaciones (
  id           uuid default uuid_generate_v4() primary key,
  para_id      uuid references public.perfiles(id) on delete cascade,
  tipo         text not null,              -- 'logro','mensaje','alerta'
  titulo       text not null,
  cuerpo       text,
  leida        boolean default false,
  created_at   timestamptz default now()
);

-- ============================================================
-- TABLA: logros (badges / achievements)
-- ============================================================
create table public.logros_usuario (
  id             uuid default uuid_generate_v4() primary key,
  estudiante_id  uuid references public.perfiles(id) on delete cascade,
  logro_id       text not null,            -- clave del catálogo de logros
  desbloqueado   timestamptz default now(),
  unique(estudiante_id, logro_id)
);

-- ============================================================
-- RLS (Row Level Security) — seguridad por fila
-- ============================================================
alter table public.perfiles         enable row level security;
alter table public.salones          enable row level security;
alter table public.progreso         enable row level security;
alter table public.publicaciones    enable row level security;
alter table public.comentarios      enable row level security;
alter table public.notificaciones   enable row level security;
alter table public.logros_usuario   enable row level security;

-- Perfiles: cada usuario solo ve/edita el suyo
create policy "ver propio perfil" on public.perfiles
  for select using (auth.uid() = id);
create policy "editar propio perfil" on public.perfiles
  for update using (auth.uid() = id);

-- Progreso: estudiante ve el suyo; docentes ven los de su salón
create policy "estudiante ve su progreso" on public.progreso
  for select using (auth.uid() = estudiante_id);
create policy "estudiante inserta progreso" on public.progreso
  for insert with check (auth.uid() = estudiante_id);

-- Publicaciones aprobadas son visibles para todos los autenticados
create policy "ver publicaciones aprobadas" on public.publicaciones
  for select using (aprobado = true or auth.uid() = autor_id);
create policy "crear publicacion" on public.publicaciones
  for insert with check (auth.uid() = autor_id);

-- Notificaciones: solo el destinatario las ve
create policy "ver mis notificaciones" on public.notificaciones
  for select using (auth.uid() = para_id);
create policy "marcar leida" on public.notificaciones
  for update using (auth.uid() = para_id);

-- Logros
create policy "ver mis logros" on public.logros_usuario
  for select using (auth.uid() = estudiante_id);

-- ============================================================
-- FUNCIÓN: trigger que crea perfil automáticamente al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.perfiles (id, rol, nombre, apodo, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'rol', 'padre'),
    coalesce(new.raw_user_meta_data->>'nombre', 'Usuario'),
    new.raw_user_meta_data->>'apodo',
    coalesce(new.raw_user_meta_data->>'avatar', '🐻')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- DATOS INICIALES: catálogo de logros
-- (referenciados por logro_id en logros_usuario)
-- ============================================================
-- Los logros se definen en el frontend (js/modules/logros.js)
-- para no requerir tabla adicional y ahorrar queries

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
create index on public.progreso(estudiante_id);
create index on public.publicaciones(espacio, aprobado);
create index on public.notificaciones(para_id, leida);
create index on public.logros_usuario(estudiante_id);
