import React, { useState, useEffect } from 'react';
import { 
  X, Database, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, 
  ExternalLink, Key, Globe, Shield, Terminal, Download, Sparkles 
} from 'lucide-react';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  testSupabaseConnection, 
  isSupabaseConfigured
} from '../supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectionSuccess
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latency: number; error?: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url || '');
      setAnonKey(creds.anonKey || '');
      setSavedSuccess(false);
      setTestResult(null);
      if (isSupabaseConfigured()) {
        runTest();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection();
    setTestResult(result);
    setTesting(false);
    if (result.ok && onConnectionSuccess) {
      onConnectionSuccess();
    }
  };

  const handleSave = () => {
    saveSupabaseCredentials(url, anonKey);
    setSavedSuccess(true);
    runTest();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const sqlSchemaScript = `-- SCHEMA COMPLETO PARA SUPABASE - REMIX RECETARIO JCB
-- Copia y pega este script en: Supabase > SQL Editor > New query > Run

create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id text primary key,
  uid text,
  email text not null,
  display_name text,
  teacher_name text,
  teacher_logo text,
  institute_name text default 'IES La Flota',
  institute_logo text,
  is_approved boolean default false,
  role text default 'user',
  created_at bigint default (extract(epoch from now()) * 1000)::bigint,
  workspace_id text,
  request_message text
);

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
  last_modified bigint default (extract(epoch from now()) * 1000)::bigint,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

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

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text,
  unit text not null default 'g',
  price_per_unit numeric not null default 0,
  weight_per_unit numeric,
  allergens jsonb default '[]'::jsonb,
  status text default 'approved',
  requested_by text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

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

create table if not exists public.settings (
  id text primary key,
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

create table if not exists public.workspace_invites (
  id text primary key,
  email text not null,
  workspace_id text not null,
  inviter_name text,
  created_at bigint default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists idx_recipes_workspace on public.recipes(workspace_id);
create index if not exists idx_recipes_is_public on public.recipes(is_public);
create index if not exists idx_pro_recipes_workspace on public.pro_recipes(workspace_id);

alter table public.users enable row level security;
alter table public.recipes enable row level security;
alter table public.pro_recipes enable row level security;
alter table public.products enable row level security;
alter table public.menu_plans enable row level security;
alter table public.settings enable row level security;
alter table public.workspace_invites enable row level security;

drop policy if exists "Allow all on users" on public.users;
drop policy if exists "Allow all on recipes" on public.recipes;
drop policy if exists "Allow all on pro_recipes" on public.pro_recipes;
drop policy if exists "Allow all on products" on public.products;
drop policy if exists "Allow all on menu_plans" on public.menu_plans;
drop policy if exists "Allow all on settings" on public.settings;
drop policy if exists "Allow all on workspace_invites" on public.workspace_invites;

create policy "Users own or admin read" on public.users for select using (auth.uid()::text = id or exists (select 1 from public.users u where u.id = auth.uid()::text and u.role = 'admin'));
create policy "Users self insert non-admin" on public.users for insert with check (auth.uid()::text = id and role = 'user' and is_approved = false);
create policy "Users self update safe" on public.users for update using (auth.uid()::text = id) with check (auth.uid()::text = id);
create policy "Recipes authenticated access" on public.recipes for select using (auth.role() = 'authenticated' and (is_public = true or workspace_id = auth.uid()::text));
create policy "Recipes authenticated write" on public.recipes for insert with check (auth.role() = 'authenticated' and workspace_id = auth.uid()::text);
create policy "Recipes owner update" on public.recipes for update using (auth.role() = 'authenticated' and workspace_id = auth.uid()::text);
create policy "ProRecipes workspace read" on public.pro_recipes for select using (auth.role() = 'authenticated' and workspace_id = auth.uid()::text);
create policy "ProRecipes workspace write" on public.pro_recipes for all using (auth.role() = 'authenticated' and workspace_id = auth.uid()::text) with check (auth.role() = 'authenticated' and workspace_id = auth.uid()::text);
create policy "Products authenticated read" on public.products for select using (auth.role() = 'authenticated');
create policy "MenuPlans workspace access" on public.menu_plans for all using (auth.role() = 'authenticated' and workspace_id = auth.uid()::text) with check (auth.role() = 'authenticated' and workspace_id = auth.uid()::text);
create policy "Settings authenticated read" on public.settings for select using (auth.role() = 'authenticated');
create policy "Invites workspace access" on public.workspace_invites for select using (auth.role() = 'authenticated' and (workspace_id = auth.uid()::text or lower(email) = lower(auth.jwt()->>'email')));

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
end $$;`;

  const copyScript = () => {
    navigator.clipboard.writeText(sqlSchemaScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const downloadSql = () => {
    const blob = new Blob([sqlSchemaScript], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supabase_recetario_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database size={22} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                Conexión con Supabase
                <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  PostgreSQL
                </span>
              </h2>
              <p className="text-xs text-slate-400">Sustitución de Firebase por Supabase Cloud</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status banner */}
          <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
            testResult?.ok 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' 
              : testResult && !testResult.ok
              ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
              : isSupabaseConfigured()
              ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
              : 'bg-slate-800/60 border-slate-700 text-slate-300'
          }`}>
            <div className="flex items-start gap-3">
              {testing ? (
                <RefreshCw size={20} className="animate-spin text-amber-400 mt-0.5 shrink-0" />
              ) : testResult?.ok ? (
                <CheckCircle2 size={20} className="text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={20} className="text-amber-400 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {testing 
                    ? 'Comprobando conexión con Supabase...' 
                    : testResult?.ok 
                    ? `¡Conexión establecida con éxito! (${testResult.latency}ms)` 
                    : testResult && !testResult.ok
                    ? `Error de conexión: ${testResult.error}`
                    : isSupabaseConfigured()
                    ? 'Credenciales cargadas. Pulsa "Probar Conexión" para verificar.'
                    : 'Supabase no configurado aún.'}
                </p>
                {testResult?.error && testResult.ok && (
                  <p className="text-xs text-amber-300 mt-1">{testResult.error}</p>
                )}
              </div>
            </div>

            <button
              onClick={runTest}
              disabled={testing || !url || !anonKey}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-slate-600 disabled:opacity-40"
            >
              <RefreshCw size={12} className={testing ? 'animate-spin' : ''} />
              Probar
            </button>
          </div>

          {/* Form Credentials */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <Globe size={14} className="text-emerald-400" />
                Project URL de Supabase (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Encuéntralo en tu proyecto de <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-0.5">Supabase &gt; Project Settings &gt; API <ExternalLink size={10} /></a>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <Key size={14} className="text-emerald-400" />
                API Anon Key pública (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Usa la clave anónima (`anon` / `public`), nunca la `service_role`.
              </p>
              {anonKey.toLowerCase().includes('service_role') && (
                <div className="mt-2 p-2.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start gap-2">
                  <Shield size={16} className="text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <strong>⚠️ ALERTA DE SEGURIDAD CRÍTICA:</strong> Has introducido una clave <code>service_role</code>. Las claves de rol de servicio NUNCA deben ponerse en el frontend porque ignoran la seguridad RLS y permiten control total sobre la base de datos. Por favor, usa la clave <code>anon</code> / <code>public</code>.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {savedSuccess && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Check size={14} /> ¡Credenciales guardadas!
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition shadow-lg flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              Guardar Credenciales
            </button>
          </div>

          {/* SQL Script Section */}
          <div className="border-t border-slate-800 pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Terminal size={16} className="text-amber-400" />
                  Script de Creación de Tablas (SQL)
                </h3>
                <p className="text-xs text-slate-400">
                  Pega este código en el <strong>SQL Editor</strong> de Supabase para inicializar todas las tablas, índices y Realtime.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadSql}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5"
                  title="Descargar schema.sql"
                >
                  <Download size={13} />
                  Descargar
                </button>
                <button
                  onClick={copyScript}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                  {copiedSql ? '¡Copiado!' : 'Copiar SQL'}
                </button>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto font-mono text-[11px] text-slate-400">
              <pre>{sqlSchemaScript}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center text-xs text-slate-500">
          <span>Los datos se guardan tanto en Supabase como en la caché local segura del navegador.</span>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
