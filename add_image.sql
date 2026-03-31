-- Add image_url column to items
alter table items add column if not exists image_url text;

-- Create storage bucket for item images
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

-- Allow household members to upload/read images
create policy "authenticated users can upload item images"
  on storage.objects for insert
  with check (bucket_id = 'item-images' and auth.role() = 'authenticated');

create policy "item images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'item-images');

create policy "authenticated users can delete item images"
  on storage.objects for delete
  using (bucket_id = 'item-images' and auth.role() = 'authenticated');
