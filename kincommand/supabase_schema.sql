-- ============================================================================
-- KinCircle Database Schema (Multi-tenant, RLS-enforced)
-- Run this in your Supabase SQL Editor to set up the backend.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 0. Families & Membership
-- ============================================================================
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now()
);

create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'ADMIN',
  created_at timestamp with time zone default now(),
  unique (family_id, user_id)
);

-- 1. Ledger Entries (Expenses & Time)
create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
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
  family_id uuid not null references families(id) on delete cascade,
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
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  type text,
  size text,
  date timestamp with time zone,
  storage_path text, -- Path in Supabase Storage bucket
  created_at timestamp with time zone default now()
);

-- 4. Family Settings (Per-family)
create table if not exists family_settings (
  family_id uuid primary key references families(id) on delete cascade,
  settings jsonb not null,
  updated_at timestamp with time zone default now()
);

-- 5. Security Logs
create table if not exists security_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  timestamp timestamp with time zone default now(),
  type text,
  details text,
  severity text,
  user_name text,
  created_at timestamp with time zone default now()
);

-- ============================================================================
-- Phase 2 Tables (Recurring, Invites, Help Tasks, Medications)
-- ============================================================================
create table if not exists recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  user_id text not null,
  description text not null,
  amount numeric not null,
  category text not null,
  frequency text not null,
  next_due_date timestamp with time zone not null,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  email text,
  name text not null,
  role text not null,
  status text not null default 'pending',
  invited_by_user_id text not null,
  invited_at timestamp with time zone default now(),
  invite_code text not null,
  created_at timestamp with time zone default now()
);

create table if not exists help_tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  date timestamp with time zone not null,
  time_slot text,
  created_by_user_id text not null,
  claimed_by_user_id text,
  status text not null default 'available',
  estimated_minutes integer,
  converted_to_entry_id uuid references ledger_entries(id),
  created_at timestamp with time zone default now()
);

create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  dosage text not null,
  frequency text not null,
  prescribed_for text,
  pharmacy text,
  refill_date timestamp with time zone,
  monthly_cost numeric,
  notes text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists medication_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  medication_id uuid not null references medications(id) on delete cascade,
  taken_at timestamp with time zone default now(),
  status text not null default 'taken',
  notes text
);

-- ============================================================================
-- Row Level Security (RLS)
-- Enforce per-family access via membership.
-- ============================================================================

alter table families enable row level security;
alter table family_members enable row level security;
alter table ledger_entries enable row level security;
alter table tasks enable row level security;
alter table vault_documents enable row level security;
alter table family_settings enable row level security;
alter table security_logs enable row level security;
alter table recurring_expenses enable row level security;
alter table family_invites enable row level security;
alter table help_tasks enable row level security;
alter table medications enable row level security;
alter table medication_logs enable row level security;

-- Policies: Families & Membership
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'families'
      and policyname = 'Members can read their family'
  ) then
    create policy "Members can read their family" on families
      for select
      using (id in (select family_id from family_members where user_id = auth.uid()));
  else
    alter policy "Members can read their family" on families
      using (id in (select family_id from family_members where user_id = auth.uid()));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'families'
      and policyname = 'Authenticated can create families'
  ) then
    create policy "Authenticated can create families" on families
      for insert
      with check (auth.role() = 'authenticated');
  else
    alter policy "Authenticated can create families" on families
      with check (auth.role() = 'authenticated');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'family_members'
      and policyname = 'Users can read their memberships'
  ) then
    create policy "Users can read their memberships" on family_members
      for select
      using (user_id = auth.uid());
  else
    alter policy "Users can read their memberships" on family_members
      using (user_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'family_members'
      and policyname = 'Users can create their membership'
  ) then
    create policy "Users can create their membership" on family_members
      for insert
      with check (user_id = auth.uid());
  else
    alter policy "Users can create their membership" on family_members
      with check (user_id = auth.uid());
  end if;
end
$$;

-- Policy helper: family members can access rows
-- (applies to all family-scoped tables)
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ledger_entries'
      and policyname = 'Family members can access rows'
  ) then
    create policy "Family members can access rows" on ledger_entries
      for all
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  else
    alter policy "Family members can access rows" on ledger_entries
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
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
      and policyname = 'Family members can access rows'
  ) then
    create policy "Family members can access rows" on tasks
      for all
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  else
    alter policy "Family members can access rows" on tasks
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
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
      and policyname = 'Family members can access rows'
  ) then
    create policy "Family members can access rows" on vault_documents
      for all
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  else
    alter policy "Family members can access rows" on vault_documents
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
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
      and policyname = 'Family members can access rows'
  ) then
    create policy "Family members can access rows" on family_settings
      for all
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  else
    alter policy "Family members can access rows" on family_settings
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
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
      and policyname = 'Family members can access rows'
  ) then
    create policy "Family members can access rows" on security_logs
      for all
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  else
    alter policy "Family members can access rows" on security_logs
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'recurring_expenses'
      and policyname = 'Family members can access rows'
  ) then
    create policy "Family members can access rows" on recurring_expenses
      for all
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  else
    alter policy "Family members can access rows" on recurring_expenses
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'family_invites'
      and policyname = 'Family members can access rows'
  ) then
    create policy "Family members can access rows" on family_invites
      for all
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  else
    alter policy "Family members can access rows" on family_invites
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'help_tasks'
      and policyname = 'Family members can access rows'
  ) then
    create policy "Family members can access rows" on help_tasks
      for all
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  else
    alter policy "Family members can access rows" on help_tasks
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'medications'
      and policyname = 'Family members can access rows'
  ) then
    create policy "Family members can access rows" on medications
      for all
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  else
    alter policy "Family members can access rows" on medications
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'medication_logs'
      and policyname = 'Family members can access rows'
  ) then
    create policy "Family members can access rows" on medication_logs
      for all
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
  else
    alter policy "Family members can access rows" on medication_logs
      using ( family_id in (select family_id from family_members where user_id = auth.uid()) )
      with check ( family_id in (select family_id from family_members where user_id = auth.uid()) );
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

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'recurring_expenses'
  ) then
    alter publication supabase_realtime add table recurring_expenses;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'family_invites'
  ) then
    alter publication supabase_realtime add table family_invites;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'help_tasks'
  ) then
    alter publication supabase_realtime add table help_tasks;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'medications'
  ) then
    alter publication supabase_realtime add table medications;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'medication_logs'
  ) then
    alter publication supabase_realtime add table medication_logs;
  end if;
end
$$;

-- ========================================================================
-- Schema evolution (safe to re-run)
-- ========================================================================
alter table if exists ledger_entries add column if not exists receipt_url text;
alter table if exists ledger_entries add column if not exists is_medicaid_flagged boolean default false;
alter table if exists ledger_entries add column if not exists ai_analysis text;

alter table if exists ledger_entries add column if not exists family_id uuid;
alter table if exists tasks add column if not exists family_id uuid;
alter table if exists vault_documents add column if not exists family_id uuid;
alter table if exists family_settings add column if not exists family_id uuid;
alter table if exists security_logs add column if not exists family_id uuid;
alter table if exists recurring_expenses add column if not exists family_id uuid;
alter table if exists family_invites add column if not exists family_id uuid;
alter table if exists help_tasks add column if not exists family_id uuid;
alter table if exists medications add column if not exists family_id uuid;
alter table if exists medication_logs add column if not exists family_id uuid;

alter table if exists family_settings drop constraint if exists singleton_check;
alter table if exists family_settings drop column if exists id;
