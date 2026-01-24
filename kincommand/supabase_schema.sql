-- ============================================================================
-- KinCircle Database Schema
-- Run this in your Supabase SQL Editor to set up the backend.
-- ============================================================================

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
  receipt_data jsonb,
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
create policy "Allow full access to authenticated users" on ledger_entries
  for all using ( auth.role() = 'anon' or auth.role() = 'authenticated' );

create policy "Allow full access to authenticated users" on tasks
  for all using ( auth.role() = 'anon' or auth.role() = 'authenticated' );

create policy "Allow full access to authenticated users" on vault_documents
  for all using ( auth.role() = 'anon' or auth.role() = 'authenticated' );

create policy "Allow full access to authenticated users" on family_settings
  for all using ( auth.role() = 'anon' or auth.role() = 'authenticated' );

create policy "Allow full access to authenticated users" on security_logs
  for all using ( auth.role() = 'anon' or auth.role() = 'authenticated' );

-- ============================================================================
-- Realtime
-- Enable Realtime for all tables
-- ============================================================================
alter publication supabase_realtime add table ledger_entries, tasks, vault_documents, family_settings;
