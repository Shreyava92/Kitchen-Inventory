create table shopping_list (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  quantity numeric,
  unit text,
  category text,
  subcategory text,
  item_id uuid references items(id) on delete set null,
  checked boolean default false,
  created_at timestamptz default now()
);

alter table shopping_list enable row level security;

create policy "members can manage shopping list"
  on shopping_list for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));
