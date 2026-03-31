-- ============================================================
-- Kitchen Inventory — Supabase Schema
-- Run this in the Supabase SQL Editor (supabase.com/dashboard)
-- ============================================================

-- Enable UUID extension (already on by default in Supabase)
create extension if not exists "pgcrypto";

-- Households
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default upper(substring(gen_random_uuid()::text, 1, 6)),
  created_at timestamptz default now()
);

-- Household members (users belong to a household)
create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(household_id, user_id)
);

-- Locations (fridge, cabinet, pantry shelf, etc.)
create table locations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('fridge','freezer','pantry','cabinet','counter','other')),
  created_at timestamptz default now()
);

-- Items
create table items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  location_id uuid references locations(id) on delete set null,
  name text not null,
  category text not null check (category in ('food','supplement','beverage','cleaning','other')),
  subcategory text check (
    subcategory is null or subcategory in (
      'dairy','produce','meat & seafood','grains & bread',
      'sauces & condiments','snacks','canned & jarred',
      'frozen','spices & seasonings','other'
    )
  ),
  quantity numeric,
  unit text,
  expiry_date date,
  low_stock_flag boolean default false,
  added_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table households enable row level security;
alter table household_members enable row level security;
alter table locations enable row level security;
alter table items enable row level security;

-- Helper: check if the current user belongs to a household
create or replace function is_household_member(hid uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

-- Households: members can read; anyone authenticated can create
create policy "members can view household" on households
  for select using (is_household_member(id));

create policy "authenticated users can create household" on households
  for insert with check (auth.uid() is not null);

create policy "members can update household" on households
  for update using (is_household_member(id));

-- Household members
create policy "members can view membership" on household_members
  for select using (is_household_member(household_id));

create policy "authenticated users can join household" on household_members
  for insert with check (auth.uid() = user_id);

-- Locations
create policy "members can view locations" on locations
  for select using (is_household_member(household_id));

create policy "members can insert locations" on locations
  for insert with check (is_household_member(household_id));

create policy "members can update locations" on locations
  for update using (is_household_member(household_id));

create policy "members can delete locations" on locations
  for delete using (is_household_member(household_id));

-- Items
create policy "members can view items" on items
  for select using (is_household_member(household_id));

create policy "members can insert items" on items
  for insert with check (is_household_member(household_id));

create policy "members can update items" on items
  for update using (is_household_member(household_id));

create policy "members can delete items" on items
  for delete using (is_household_member(household_id));
