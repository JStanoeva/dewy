-- Key actives, plus the bottle size and how full it was on tracked_from, the ritual day "uses left" counts from.
alter table public.products
  add column actives text[] not null default '{}',
  add column size_ml integer,
  add column start_fraction numeric not null default 1,
  -- The app always sends the ritual day; the UTC date only covers older app versions.
  add column tracked_from date not null default current_date,
  add constraint products_actives_check
    check (
      coalesce(array_ndims(actives), 1) = 1
      and actives <@ array['retinoid', 'vitc', 'acids', 'bpo']
      and array_position(actives, null) is null
      and cardinality(array_positions(actives, 'retinoid')) <= 1
      and cardinality(array_positions(actives, 'vitc')) <= 1
      and cardinality(array_positions(actives, 'acids')) <= 1
      and cardinality(array_positions(actives, 'bpo')) <= 1
    ),
  add constraint products_size_ml_check
    check (size_ml between 1 and 1000),
  add constraint products_start_fraction_check
    check (start_fraction in (1, 0.75, 0.5, 0.25)),
  -- Like opened_on, one day of slack for users ahead of UTC.
  add constraint products_tracked_from_check
    check (tracked_from between date '2000-01-01' and current_date + 1);

grant insert (actives, size_ml, start_fraction, tracked_from),
  update (actives, size_ml, start_fraction, tracked_from)
  on public.products to authenticated;
