-- Private bucket for product photos, one folder per user: {user_id}/{uuid}.jpg.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', false, 5242880, array['image/jpeg']);

-- Every upload gets a new name, so there is no update policy: nothing is overwritten or moved.
create policy "Users can view their own product photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Uploads must be named exactly {user_id}/{uuid}.jpg, so no nested or odd names get in.
create policy "Users can upload their own product photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-photos'
    and name ~ (
      '^' || (select auth.uid())::text
      || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
    )
  );

create policy "Users can delete their own product photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- A product's photo must be a file in its owner's own folder.
alter table public.products
  add constraint products_photo_path_own_folder check (
    photo_path is null
    or photo_path ~ (
      '^' || user_id::text
      || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
    )
  );
