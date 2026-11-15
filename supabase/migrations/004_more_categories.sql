-- Adds the exfoliant and mist categories; the order matches the app's routine order.
alter table public.products
  drop constraint products_category_check,
  add constraint products_category_check
    check (category in ('cleanser', 'exfoliant', 'toner', 'mist', 'serum', 'moisturizer', 'spf', 'mask'));

alter table public.profiles
  drop constraint profiles_starter_categories_check,
  add constraint profiles_starter_categories_check
    check (starter_categories <@ array['cleanser', 'exfoliant', 'toner', 'mist', 'serum', 'moisturizer', 'spf', 'mask']);
