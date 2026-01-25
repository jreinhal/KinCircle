-- ============================================================================
-- KinCircle Database Schema
-- Run this in your Supabase SQL Editor to set up the backend.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Ledger Entries (Expenses & Time)
create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, -- Stores the ID of the user who created it
  amount numeric,
  description text,
  category text,
  type text check (type in ('EXPENSE', 'TIME')),
  date timestamp with time zone,
  time_duration_minutes integer,
  receipt_url text,
  receipt_data jsonb,
  is_medicaid_flagged boolean default false,
  ai_analysis text,
  created_at timestamp with time zone default now()
);

-- 2. Tasks (Schedule)
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assigned_user_id text,
  due_date timestamp with time zone,
  is_completed boolean default false,
  related_entry_id uuid references ledger_entries(id),
  created_at timestamp with time zone default now()
);

-- 3. Vault Documents (Metadata only for Phase 2)
create table if not exists vault_documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  size text,
  date timestamp with time zone,
  storage_path text, -- Path in Supabase Storage bucket
  created_at timestamp with time zone default now()
);

-- 4. Family Settings (Singleton)
create table if not exists family_settings (
  id integer primary key default 1, -- Force singleton
  settings jsonb not null,
  updated_at timestamp with time zone default now(),
  constraint singleton_check check (id = 1)
);

-- 5. Security Logs
create table if not exists security_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamp with time zone default now(),
  type text,
  details text,
  severity text,
  user_name text,
  created_at timestamp with time zone default now()
);

-- ============================================================================
-- Row Level Security (RLS)
-- For Phase 2 (Trusted Family Mode), we allow all authenticated users to read/write.
-- ============================================================================

alter table ledger_entries enable row level security;
alter table tasks enable row level security;
alter table vault_documents enable row level security;
alter table family_settings enable row level security;
alter table security_logs enable row level security;

-- Policy: Allow full access to authenticated users
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ledger_entries'
      and policyname = 'Allow full access to authenticated users'
  ) then
    create policy "Allow full access to authenticated users" on ledger_entries
      for all
      using ( auth.role() = 'anon' or auth.role() = 'authenticated' )
      with check ( auth.role() = 'anon' or auth.role() = 'authenticated' );
  else
    alter policy "Allow full access to authenticated users" on ledger_entries
      using ( auth.role() = 'anon' or auth.role() = 'authenticated' )
      with check ( auth.role() = 'anon' or auth.role() = 'authenticated' );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tasks'
      and policyname = 'Allow full access to authenticated users'
  ) then
    create policy "Allow full access to authenticated users" on tasks
      for all
      using ( auth.role() = 'anon' or auth.role() = 'authenticated' )
      with check ( auth.role() = 'anon' or auth.role() = 'authenticated' );
  else
    alter policy "Allow full access to authenticated users" on tasks
      using ( auth.role() = 'anon' or auth.role() = 'authenticated' )
      with check ( auth.role() = 'anon' or auth.role() = 'authenticated' );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vault_documents'
      and policyname = 'Allow full access to authenticated users'
  ) then
    create policy "Allow full access to authenticated users" on vault_documents
      for all
      using ( auth.role() = 'anon' or auth.role() = 'authenticated' )
      with check ( auth.role() = 'anon' or auth.role() = 'authenticated' );
  else
    alter policy "Allow full access to authenticated users" on vault_documents
      using ( auth.role() = 'anon' or auth.role() = 'authenticated' )
      with check ( auth.role() = 'anon' or auth.role() = 'authenticated' );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'family_settings'
      and policyname = 'Allow full access to authenticated users'
  ) then
    create policy "Allow full access to authenticated users" on family_settings
      for all
      using ( auth.role() = 'anon' or auth.role() = 'authenticated' )
      with check ( auth.role() = 'anon' or auth.role() = 'authenticated' );
  else
    alter policy "Allow full access to authenticated users" on family_settings
      using ( auth.role() = 'anon' or auth.role() = 'authenticated' )
      with check ( auth.role() = 'anon' or auth.role() = 'authenticated' );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'security_logs'
      and policyname = 'Allow full access to authenticated users'
  ) then
    create policy "Allow full access to authenticated users" on security_logs
      for all
      using ( auth.role() = 'anon' or auth.role() = 'authenticated' )
      with check ( auth.role() = 'anon' or auth.role() = 'authenticated' );
  else
    alter policy "Allow full access to authenticated users" on security_logs
      using ( auth.role() = 'anon' or auth.role() = 'authenticated' )
      with check ( auth.role() = 'anon' or auth.role() = 'authenticated' );
  end if;
end
$$;

-- ============================================================================
-- Realtime
-- Enable Realtime for all tables
-- ============================================================================
do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'ledger_entries'
  ) then
    alter publication supabase_realtime add table ledger_entries;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'tasks'
  ) then
    alter publication supabase_realtime add table tasks;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'vault_documents'
  ) then
    alter publication supabase_realtime add table vault_documents;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'family_settings'
  ) then
    alter publication supabase_realtime add table family_settings;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'security_logs'
  ) then
    alter publication supabase_realtime add table security_logs;
  end if;
end
$$;

-- ========================================================================
-- Schema evolution (safe to re-run)
-- ========================================================================
alter table if exists ledger_entries add column if not exists receipt_url text;
alter table if exists ledger_entries add column if not exists is_medicaid_flagged boolean default false;
alter table if exists ledger_entries add column if not exists ai_analysis text;
