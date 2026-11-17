-- An important note shows as a banner on Today; only a step with a note can be important.
alter table public.routine_steps
  add column note_important boolean not null default false,
  add constraint routine_steps_note_important_needs_note
    check (not note_important or note is not null);

-- Older app versions never send note_important, so clearing a note turns it off instead of failing the check.
create function public.routine_steps_note_important_fit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.note_important := coalesce(new.note_important, false) and new.note is not null;
  return new;
end;
$$;

create trigger routine_steps_note_important_fit
  before insert or update on public.routine_steps
  for each row execute function public.routine_steps_note_important_fit();

revoke execute on function public.routine_steps_note_important_fit() from public, anon, authenticated;

grant insert (note_important), update (note_important) on public.routine_steps to authenticated;

-- Notes Today already showed (on steps that don't run every day) start as important; daily ones don't.
update public.routine_steps
set note_important = true
where note is not null
  and not (weekdays @> '{1,2,3,4,5,6,7}'::smallint[]);
