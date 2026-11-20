-- ==============================================================================
-- SCHEMA COMPLETO Y ENDURECIDO PARA SUPABASE - REMIX RECETARIO JCB (IES LA FLOTA)
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase (supabase.com)
-- ==============================================================================

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";

-- 2. TABLA DE USUARIOS Y PERFILES (vinculada a Auth)
create table if not exists public.users (
  id text primary key, -- Corresponde al UID de Supabase Auth
  uid text,
  email text not null,
  display_name text,
  teacher_name text,
  teacher_logo text,
  institute_name text default 'IES La Flota',
  institute_logo text,
  is_approved boolean default false,
  role text default 'user', -- 'admin' o 'user'
  created_at bigint default (extract(epoch from now()) * 1000)::bigint,
  workspace_id text,
  request_message text
);

-- 3. TABLA DE RECETAS TÉCNICAS (Académicas y de Producción)
create table if not exists public.recipes (
  id text primary key,
  workspace_id text not null,
  user_id text,
  name text not null,
  category text,
  categories jsonb default '[]'::jsonb,
  photo text,
  photo_layout text default 'classic',
  creator text,
  creator_logo text,
  is_public boolean default false,
  original_author text,
  source_url text,
  videos jsonb default '[]'::jsonb,
  video_url text,
  yield_quantity numeric default 4,
  yield_unit text default 'pax',
  sub_recipes jsonb default '[]'::jsonb,
  plating_instructions text,
  service_details jsonb default '{}'::jsonb,
  extra_allergens jsonb default '[]'::jsonb,
  minimalist_card jsonb default '{}'::jsonb,
  take_away_details jsonb default '{}'::jsonb,
  total_cost numeric default 0,
  recipe_type text default 'normal',
  last_modified bigint default (extract(epoch from now()) * 1000)::bigint,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. TABLA DE RECETAS DE TALLER I+D PROFESIONAL (ProRecipes)
create table if not exists public.pro_recipes (
  id text primary key,
  workspace_id text not null,
  code text,
  version text default '1.0',
  status text default 'development',
  responsible text,
  name text not null,
  technical_name text,
  category text,
  target_pax numeric default 4,
  concept text,
  star_product text,
  storytelling text,
  hero_photo text,
  sketch_photo text,
  sensory_profile jsonb default '{}'::jsonb,
  components jsonb default '[]'::jsonb,
  plating jsonb default '{}'::jsonb,
  quality_control jsonb default '{}'::jsonb,
  traceability jsonb default '{}'::jsonb,
  last_modified bigint default (extract(epoch from now()) * 1000)::bigint,
  created_at bigint default (extract(epoch from now()) * 1000)::bigint
);

-- 5. TABLA DE PRODUCTOS E INGREDIENTES
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text,
  unit text not null default 'g',
  price_per_unit numeric not null default 0,
  weight_per_unit numeric,
  allergens jsonb default '[]'::jsonb,
  status text default 'approved', -- 'approved' o 'pending'
  requested_by text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. TABLA DE PLANES DE MENÚ (MenuPlanner)
create table if not exists public.menu_plans (
  id text primary key,
  workspace_id text not null,
  title text not null,
  date text not null,
  pax integer default 20,
  recipe_ids jsonb default '[]'::jsonb,
  recipe_roles jsonb default '{}'::jsonb,
  dish_extra_ingredients jsonb default '{}'::jsonb,
  dish_approvals jsonb default '{}'::jsonb,
  work_schedule jsonb default '[]'::jsonb,
  group_count integer default 4,
  dish_group_assignments jsonb default '{}'::jsonb,
  group_notes jsonb default '{}'::jsonb,
  work_order_advance_notes jsonb default '{}'::jsonb,
  custom_menu_roles jsonb default '[]'::jsonb,
  dish_ingredient_overrides jsonb default '{}'::jsonb,
  kitchen_checklist jsonb default '{}'::jsonb,
  service_details_overrides jsonb default '{}'::jsonb,
  last_modified bigint default (extract(epoch from now()) * 1000)::bigint,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. TABLA DE CONFIGURACIONES GENERALES DEL CENTRO
create table if not exists public.settings (
  id text primary key, -- 'global' o workspace_id
  institute_name text default 'IES La Flota',
  institute_logo text,
  teacher_name text,
  teacher_logo text,
  categories jsonb default '[]'::jsonb,
  category_configs jsonb default '[]'::jsonb,
  work_schedule jsonb default '[]'::jsonb,
  default_group_count integer default 4,
  menu_roles jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 8. TABLA DE INVITACIONES DE ESPACIO DE TRABAJO
create table if not exists public.workspace_invites (
  id text primary key,
  email text not null,
  workspace_id text not null,
  inviter_name text,
  created_at bigint default (extract(epoch from now()) * 1000)::bigint
);

-- 9. ÍNDICES DE RENDIMIENTO
create index if not exists idx_recipes_workspace on public.recipes(workspace_id);
create index if not exists idx_recipes_is_public on public.recipes(is_public);
create index if not exists idx_pro_recipes_workspace on public.pro_recipes(workspace_id);
create index if not exists idx_menu_plans_workspace on public.menu_plans(workspace_id);
create index if not exists idx_products_name on public.products(name);

-- 10. FUNCIONES AUXILIARES DE SEGURIDAD RLS
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()::text
      and u.role = 'admin'
      and u.is_approved = true
  );
$$;

create or replace function public.is_current_user_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()::text
      and u.is_approved = true
  );
$$;

-- 11. HABILITAR ROW LEVEL SECURITY (RLS) ESTRICTO (PRINCIPIO DE MÍNIMO PRIVILEGIO)
alter table public.users enable row level security;
alter table public.recipes enable row level security;
alter table public.pro_recipes enable row level security;
alter table public.products enable row level security;
alter table public.menu_plans enable row level security;
alter table public.settings enable row level security;
alter table public.workspace_invites enable row level security;

-- Eliminar políticas permisivas o previas
drop policy if exists "Allow all on users" on public.users;
drop policy if exists "Allow all on recipes" on public.recipes;
drop policy if exists "Allow all on pro_recipes" on public.pro_recipes;
drop policy if exists "Allow all on products" on public.products;
drop policy if exists "Allow all on menu_plans" on public.menu_plans;
drop policy if exists "Allow all on settings" on public.settings;
drop policy if exists "Allow all on workspace_invites" on public.workspace_invites;

-- USERS: PII aislada al propio usuario o administradores; prohibida la autopromoción de rol/aprobación
create policy "Users select own or admin" on public.users
  for select using (auth.uid()::text = id or public.is_current_user_admin());
create policy "Users insert self non-admin" on public.users
  for insert with check (
    auth.role() = 'authenticated'
    and auth.uid()::text = id
    and role = 'user'
    and is_approved = false
  );
create policy "Users update own safe or admin" on public.users
  for update using (auth.uid()::text = id or public.is_current_user_admin())
  with check (
    public.is_current_user_admin()
    or (
      auth.uid()::text = id
      and role = (select u.role from public.users u where u.id = auth.uid()::text)
      and is_approved = (select u.is_approved from public.users u where u.id = auth.uid()::text)
    )
  );
create policy "Users delete admin only" on public.users
  for delete using (public.is_current_user_admin());

-- RECIPES: Lectura autenticada (públicas, propio workspace o admin); escritura por propietario o admin
create policy "Recipes select scoped" on public.recipes
  for select using (
    auth.role() = 'authenticated'
    and (is_public = true or workspace_id = auth.uid()::text or public.is_current_user_admin())
  );
create policy "Recipes insert scoped" on public.recipes
  for insert with check (
    auth.role() = 'authenticated'
    and public.is_current_user_approved()
    and (workspace_id = auth.uid()::text or public.is_current_user_admin())
  );
create policy "Recipes update scoped" on public.recipes
  for update using (
    auth.role() = 'authenticated'
    and (workspace_id = auth.uid()::text or public.is_current_user_admin())
  )
  with check (
    workspace_id = auth.uid()::text or public.is_current_user_admin()
  );
create policy "Recipes delete scoped" on public.recipes
  for delete using (
    auth.role() = 'authenticated'
    and (workspace_id = auth.uid()::text or public.is_current_user_admin())
  );

-- PRO RECIPES: Aisladas por workspace o admin
create policy "Pro recipes select scoped" on public.pro_recipes
  for select using (
    auth.role() = 'authenticated'
    and (workspace_id = auth.uid()::text or public.is_current_user_admin())
  );
create policy "Pro recipes write scoped" on public.pro_recipes
  for all using (
    auth.role() = 'authenticated'
    and (workspace_id = auth.uid()::text or public.is_current_user_admin())
  )
  with check (
    auth.role() = 'authenticated'
    and public.is_current_user_approved()
    and (workspace_id = auth.uid()::text or public.is_current_user_admin())
  );

-- PRODUCTS: Lectura autenticada; escritura admin o solicitudes pending del propio usuario
create policy "Products select authenticated" on public.products
  for select using (auth.role() = 'authenticated');
create policy "Products insert scoped" on public.products
  for insert with check (
    auth.role() = 'authenticated'
    and public.is_current_user_approved()
    and (public.is_current_user_admin() or (status = 'pending' and requested_by = auth.uid()::text))
  );
create policy "Products update admin only" on public.products
  for update using (public.is_current_user_admin())
  with check (public.is_current_user_admin());
create policy "Products delete admin only" on public.products
  for delete using (public.is_current_user_admin());

-- MENU PLANS: Aislados por workspace o admin
create policy "Menu plans all scoped" on public.menu_plans
  for all using (
    auth.role() = 'authenticated'
    and (workspace_id = auth.uid()::text or public.is_current_user_admin())
  )
  with check (
    auth.role() = 'authenticated'
    and public.is_current_user_approved()
    and (workspace_id = auth.uid()::text or public.is_current_user_admin())
  );

-- SETTINGS: Lectura autenticada; escritura admin o propio workspace
create policy "Settings select authenticated" on public.settings
  for select using (auth.role() = 'authenticated');
create policy "Settings write admin or own" on public.settings
  for all using (id = auth.uid()::text or public.is_current_user_admin())
  with check (id = auth.uid()::text or public.is_current_user_admin());

-- WORKSPACE INVITES: Solo emisor, destinatario o admin
create policy "Invites select scoped" on public.workspace_invites
  for select using (
    auth.role() = 'authenticated'
    and (
      workspace_id = auth.uid()::text
      or lower(email) = lower(auth.jwt()->>'email')
      or public.is_current_user_admin()
    )
  );
create policy "Invites write scoped" on public.workspace_invites
  for all using (workspace_id = auth.uid()::text or public.is_current_user_admin())
  with check (workspace_id = auth.uid()::text or public.is_current_user_admin());

-- 12. HABILITAR REALTIME DE FORMA SEGURA (SIN DUPLICADOS)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'recipes') then
    alter publication supabase_realtime add table public.recipes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pro_recipes') then
    alter publication supabase_realtime add table public.pro_recipes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products') then
    alter publication supabase_realtime add table public.products;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'menu_plans') then
    alter publication supabase_realtime add table public.menu_plans;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'settings') then
    alter publication supabase_realtime add table public.settings;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'users') then
    alter publication supabase_realtime add table public.users;
  end if;
end $$;
