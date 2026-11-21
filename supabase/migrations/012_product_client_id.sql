-- The app sends a new product's id with its insert, so a save retried after a lost answer finds the saved row instead of adding a second one.
grant insert (id) on public.products to authenticated;
