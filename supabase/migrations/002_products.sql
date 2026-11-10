create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null
    check (status in ('owned', 'wishlist')),
  name text not null
    check (char_length(name) <= 80 and char_length(btrim(name)) >= 2),
  brand text
    check (char_length(brand) <= 60 and btrim(brand) <> ''),
  category text not null
    check (category in ('cleanser', 'toner', 'serum', 'moisturizer', 'spf', 'mask')),
  barcode text
    check (barcode ~ '^[0-9]{6,14}$'),
  photo_path text,
  -- The server runs in UTC, so allow one day of slack for users ahead of UTC; the form checks the local date.
  opened_on date
    check (opened_on between date '2000-01-01' and current_date + 1),
  pao_months smallint
    check (pao_months in (3, 6, 12, 24)),
  ingredients text[] not null default '{}'
    check (
      cardinality(ingredients) <= 20
      and array_position(ingredients, null) is null
      and char_length(array_to_string(ingredients, '')) <= 1000
    ),
  notes text
    check (char_length(notes) <= 500),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_pao_required_when_opened check (opened_on is null or pao_months is not null),
  constraint products_wishlist_unopened check (status = 'owned' or opened_on is null)
);

create index products_user_id_idx on public.products (user_id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

create policy "Users can view their own products"
  on public.products for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can add their own products"
  on public.products for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own products"
  on public.products for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own products"
  on public.products for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Clients never set id, user_id or the timestamps; the defaults and the trigger own them.
revoke all on public.products from anon, authenticated;
grant select, delete on public.products to authenticated;
grant insert (
  status,
  name,
  brand,
  category,
  barcode,
  photo_path,
  opened_on,
  pao_months,
  ingredients,
  notes,
  is_favorite
) on public.products to authenticated;
grant update (
  status,
  name,
  brand,
  category,
  barcode,
  photo_path,
  opened_on,
  pao_months,
  ingredients,
  notes,
  is_favorite
) on public.products to authenticated;
