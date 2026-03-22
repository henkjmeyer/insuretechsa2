-- ============================================================
-- InsureTech (Insuratrack-SA) — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── Enable UUID extension ────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- POLICIES
-- ============================================================
create table if not exists public.policies (
  id                uuid        primary key default uuid_generate_v4(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  insurer           text        not null,
  policy_number     text        not null,
  type              text        not null check (type in ('motor','home','life','health','travel','business','other')),
  status            text        not null default 'active' check (status in ('active','expiring','expired','pending','cancelled')),
  premium_amount    numeric     not null check (premium_amount >= 0),
  premium_frequency text        not null default 'monthly' check (premium_frequency in ('monthly','annual')),
  start_date        date        not null,
  expiry_date       date        not null,
  cover_amount      numeric,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Index for fast per-user queries
create index if not exists policies_user_id_idx on public.policies(user_id);
create index if not exists policies_status_idx  on public.policies(user_id, status);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger policies_updated_at
  before update on public.policies
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.policies enable row level security;

create policy "Users can view own policies"
  on public.policies for select
  using (auth.uid() = user_id);

create policy "Users can insert own policies"
  on public.policies for insert
  with check (auth.uid() = user_id);

create policy "Users can update own policies"
  on public.policies for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own policies"
  on public.policies for delete
  using (auth.uid() = user_id);


-- ============================================================
-- CLAIMS
-- ============================================================
create table if not exists public.claims (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  policy_id     uuid        references public.policies(id) on delete set null,
  reference     text,
  description   text        not null,
  status        text        not null default 'pending' check (status in ('pending','submitted','in_review','approved','rejected','closed')),
  amount        numeric,
  incident_date date,
  submitted_at  timestamptz,
  resolved_at   timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists claims_user_id_idx   on public.claims(user_id);
create index if not exists claims_policy_id_idx on public.claims(policy_id);

create trigger claims_updated_at
  before update on public.claims
  for each row execute function public.set_updated_at();

alter table public.claims enable row level security;

create policy "Users can view own claims"
  on public.claims for select
  using (auth.uid() = user_id);

create policy "Users can insert own claims"
  on public.claims for insert
  with check (auth.uid() = user_id);

create policy "Users can update own claims"
  on public.claims for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own claims"
  on public.claims for delete
  using (auth.uid() = user_id);


-- ============================================================
-- ALERTS
-- ============================================================
create table if not exists public.alerts (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  policy_id  uuid        references public.policies(id) on delete cascade,
  title      text        not null,
  body       text        not null,
  severity   text        not null default 'info' check (severity in ('info','warning','danger')),
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists alerts_user_id_idx on public.alerts(user_id);
create index if not exists alerts_read_idx    on public.alerts(user_id, read);

alter table public.alerts enable row level security;

create policy "Users can view own alerts"
  on public.alerts for select
  using (auth.uid() = user_id);

create policy "Users can update own alerts"
  on public.alerts for update
  using (auth.uid() = user_id);

create policy "Users can delete own alerts"
  on public.alerts for delete
  using (auth.uid() = user_id);


-- ============================================================
-- PROFILES (mirrors auth.users with extra fields)
-- ============================================================
create table if not exists public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  full_name    text,
  phone        text,
  id_number    text,          -- SA ID number (optional)
  country      text default 'ZA',
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN UP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- SEED: optional test alert (remove before production)
-- ============================================================
-- insert into public.alerts (user_id, title, body, severity)
-- values ('<your-user-id>', 'Welcome to InsureTech', 'Start by adding your first policy.', 'info');
