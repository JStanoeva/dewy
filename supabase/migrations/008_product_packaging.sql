-- The bottle drawn for a product without a photo; existing ones get their category's usual bottle, and mists a spray.
alter table public.products
  add column packaging text;

update public.products
set packaging = case
  when category = 'serum' then 'dropper'
  when category in ('moisturizer', 'mask') then 'jar'
  when category in ('spf', 'exfoliant') then 'tube'
  when category = 'mist' then 'spray'
  else 'pump'
end
where packaging is null;

alter table public.products
  alter column packaging set not null,
  add constraint products_packaging_check
    check (packaging in ('dropper', 'pump', 'jar', 'tube', 'spray'));

-- Older app versions never send packaging, so a new product without one gets its category's usual bottle (as in categoryDetails).
create function public.set_product_packaging()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.packaging := coalesce(
    new.packaging,
    case
      when new.category = 'serum' then 'dropper'
      when new.category in ('moisturizer', 'mask') then 'jar'
      when new.category in ('spf', 'exfoliant') then 'tube'
      when new.category = 'mist' then 'spray'
      else 'pump'
    end
  );
  return new;
end;
$$;

create trigger products_set_packaging
  before insert on public.products
  for each row execute function public.set_product_packaging();

revoke execute on function public.set_product_packaging() from public, anon, authenticated;

grant insert (packaging), update (packaging) on public.products to authenticated;
