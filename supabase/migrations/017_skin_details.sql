-- Skin details (6.3b): the form's skin types and concerns, each picked at most once, and the new goals.
alter table public.profiles
  drop constraint profiles_skin_type_check,
  drop constraint profiles_concerns_check,
  add column skin_goals text[] not null default '{}',
  add constraint profiles_skin_type_check
    check (skin_type in ('dry', 'normal', 'oily', 'combination')),
  add constraint profiles_concerns_check
    check (
      coalesce(array_ndims(concerns), 1) = 1
      and concerns <@ array['sensitivity', 'redness', 'breakouts', 'dark_spots', 'fine_lines', 'dry_patches']
      and array_position(concerns, null) is null
      and cardinality(array_positions(concerns, 'sensitivity')) <= 1
      and cardinality(array_positions(concerns, 'redness')) <= 1
      and cardinality(array_positions(concerns, 'breakouts')) <= 1
      and cardinality(array_positions(concerns, 'dark_spots')) <= 1
      and cardinality(array_positions(concerns, 'fine_lines')) <= 1
      and cardinality(array_positions(concerns, 'dry_patches')) <= 1
    ),
  add constraint profiles_skin_goals_check
    check (
      coalesce(array_ndims(skin_goals), 1) = 1
      and skin_goals <@ array['hydration', 'glow', 'even_tone', 'calm', 'clear', 'smooth']
      and array_position(skin_goals, null) is null
      and cardinality(array_positions(skin_goals, 'hydration')) <= 1
      and cardinality(array_positions(skin_goals, 'glow')) <= 1
      and cardinality(array_positions(skin_goals, 'even_tone')) <= 1
      and cardinality(array_positions(skin_goals, 'calm')) <= 1
      and cardinality(array_positions(skin_goals, 'clear')) <= 1
      and cardinality(array_positions(skin_goals, 'smooth')) <= 1
    );

grant update (skin_goals) on public.profiles to authenticated;
