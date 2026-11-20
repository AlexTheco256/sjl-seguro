-- SJL Seguro: esquema de base de datos en Supabase (PostgreSQL)
-- Ejecutar en Supabase → SQL Editor (o `supabase db push`).

-- ------------------------------------------------------------------ perfiles
-- Datos de la persona y su rol; el login lo gestiona Supabase Auth (auth.users).
create table if not exists public.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null check (char_length(nombre) between 2 and 80),
  email      text not null unique,
  rol        text not null default 'ciudadano'
             check (rol in ('ciudadano', 'serenazgo', 'administrador')),
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

-- Crea el perfil automáticamente cuando alguien se registra en Supabase Auth.
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), split_part(new.email, '@', 1)),
    lower(new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- ------------------------------------------------------------------ reportes
create sequence if not exists public.reportes_codigo_seq;

create table if not exists public.reportes (
  id             uuid primary key default gen_random_uuid(),
  codigo         text not null unique
                 default 'SJL-' || lpad(nextval('public.reportes_codigo_seq')::text, 6, '0'),
  tipo           text not null
                 check (tipo in ('robo_al_paso', 'asalto_transporte', 'extorsion', 'venta_drogas', 'otro')),
  descripcion    text not null check (char_length(descripcion) between 10 and 1000),
  lat            numeric(9, 6) not null check (lat between -12.04 and -11.92),
  lng            numeric(9, 6) not null check (lng between -77.03 and -76.94),
  fecha_hora     timestamptz not null,
  anonimo        boolean not null default false,
  usuario_id     uuid references public.perfiles (id) on delete set null,
  estado         text not null default 'recibido'
                 check (estado in ('recibido', 'validado', 'descartado', 'en_atencion', 'atendido')),
  zona           text not null,
  motivo         text,
  nota           text,
  unidad         text,
  atendido_en    timestamptz,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists reportes_estado_idx     on public.reportes (estado);
create index if not exists reportes_usuario_idx    on public.reportes (usuario_id);
create index if not exists reportes_fecha_hora_idx on public.reportes (fecha_hora desc);

-- ------------------------------------------------------------------ auditoría
create table if not exists public.historial_reportes (
  id         bigint generated always as identity primary key,
  reporte_id uuid not null references public.reportes (id) on delete cascade,
  usuario_id uuid references public.perfiles (id) on delete set null,
  desde      text not null,
  hacia      text not null,
  nota       text,
  creado_en  timestamptz not null default now()
);

create index if not exists historial_reporte_idx on public.historial_reportes (reporte_id);

-- ------------------------------------------------------------------ seguridad
-- RLS activado y SIN políticas: los roles anon/authenticated no pueden leer ni
-- escribir directamente. Solo la API (service_role, en el servidor) accede a los
-- datos y aplica las reglas de negocio y de roles.
alter table public.perfiles           enable row level security;
alter table public.reportes           enable row level security;
alter table public.historial_reportes enable row level security;

revoke all on public.perfiles, public.reportes, public.historial_reportes from anon, authenticated;
revoke all on sequence public.reportes_codigo_seq from anon, authenticated;
