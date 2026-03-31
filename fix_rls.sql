-- Drop and recreate the failing policies with simpler checks
drop policy if exists "authenticated users can create household" on households;
drop policy if exists "authenticated users can join household" on household_members;

create policy "authenticated users can create household" on households
  for insert with check (auth.role() = 'authenticated');

create policy "authenticated users can join household" on household_members
  for insert with check (auth.role() = 'authenticated');
