-- Saves onboarding's first rituals and finishes onboarding in one transaction; a retry adds no step twice.
create function public.finish_onboarding(p_steps jsonb)
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_step jsonb;
  v_completed_at timestamptz;
begin
  if jsonb_typeof(p_steps) is distinct from 'array' or jsonb_array_length(p_steps) > 200 then
    raise exception 'p_steps must be an array of at most 200 steps'
      using errcode = '22023';
  end if;

  -- One insert per step, in the given order, so the position trigger appends them in that order.
  for v_step in
    select t.step from jsonb_array_elements(p_steps) with ordinality as t(step, n) order by t.n
  loop
    if jsonb_typeof(v_step -> 'product_id') is distinct from 'string'
      or (v_step ->> 'product_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or (v_step ->> 'period') is null
      or (v_step ->> 'period') not in ('morning', 'evening')
      or jsonb_typeof(v_step -> 'duration_seconds') is distinct from 'number'
    then
      raise exception 'each step needs a product_id, a period and whole duration_seconds from 10 to 1800'
        using errcode = '22023';
    end if;

    -- A separate check, since OR may run the cast before the type test above.
    if (v_step ->> 'duration_seconds')::numeric not between 10 and 1800
      or (v_step ->> 'duration_seconds')::numeric <> trunc((v_step ->> 'duration_seconds')::numeric)
    then
      raise exception 'each step needs a product_id, a period and whole duration_seconds from 10 to 1800'
        using errcode = '22023';
    end if;

    insert into public.routine_steps (product_id, period, duration_seconds)
    values (
      (v_step ->> 'product_id')::uuid,
      v_step ->> 'period',
      (v_step ->> 'duration_seconds')::integer
    )
    on conflict on constraint routine_steps_user_period_product_key do nothing;
  end loop;

  update public.profiles
  set onboarding_completed_at = coalesce(onboarding_completed_at, now())
  where id = (select auth.uid())
  returning onboarding_completed_at into v_completed_at;

  if v_completed_at is null then
    raise exception 'no profile for the signed-in user'
      using errcode = 'P0002';
  end if;

  return v_completed_at;
end;
$$;

revoke execute on function public.finish_onboarding(jsonb) from public, anon;
grant execute on function public.finish_onboarding(jsonb) to authenticated;
