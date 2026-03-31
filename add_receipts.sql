create table receipts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  scanned_at timestamptz default now(),
  store_name text,
  item_count int not null default 0,
  raw_text text
);

alter table receipts enable row level security;

create policy "members can manage receipts"
  on receipts for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));
