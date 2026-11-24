import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { useRunningLowCheck } from '@/features/reminders/hooks/useRunningLowCheck';
import { useRoutineSteps } from '@/features/routines/hooks/useRoutineSteps';
import {
  completeStep,
  isOutsideDayError,
  isStepGoneError,
  listCompletedStepIds,
  uncompleteStep,
} from '@/features/today/services/completionService';
import {
  clearRitualDone,
  listDonePeriods,
  markRitualDone,
} from '@/features/today/services/ritualDayService';
import { buildTodayRoutine, finishedRituals } from '@/features/today/utils/buildTodayRoutine';
import type { Period } from '@/theme/period';
import type { LocalDate } from '@/utils/localDate';

export function useCompletions(localDate: LocalDate) {
  return useQuery({
    queryKey: ['completions', localDate],
    queryFn: () => listCompletedStepIds(localDate),
  });
}

// The routine is built once both the steps and the day's ticks have loaded.
export function useTodayRoutine(period: Period, localDate: LocalDate) {
  const steps = useRoutineSteps();
  const completions = useCompletions(localDate);
  const routine =
    steps.data && completions.data
      ? buildTodayRoutine(steps.data, completions.data, period, localDate)
      : undefined;
  return { steps, completions, routine };
}

// Ticks and stamp writes reach the server one at a time, in order, so an untick's stamp delete can't overtake a stamp write.
const ritualDayScope = { id: 'ritualDay' };

// Stamps each ritual its saved ticks finish, both rituals, also when a delete finished it, and retries on every refetch.
export function useRitualStamps(localDate: LocalDate) {
  const queryClient = useQueryClient();
  const steps = useRoutineSteps();
  const completions = useCompletions(localDate);
  const stamps = useQuery({
    queryKey: ['completions', 'ritualDays', localDate],
    queryFn: () => listDonePeriods(localDate),
  });
  const ticking = useIsMutating({ mutationKey: ['toggleCompletion'] }) > 0;
  // Only server data counts: a tick shown before it saved could fail and leave a stamp behind.
  const settled = !ticking && !steps.isFetching && !completions.isFetching;
  const toStamp =
    settled && steps.data && completions.data && stamps.data
      ? finishedRituals(steps.data, completions.data, localDate).filter(
          (period) => !stamps.data.includes(period),
        )
      : [];
  const pending = toStamp.join(',');
  // A failed write is tried again after the next refetch, while the day is still open.
  const { mutate: stamp } = useMutation({
    scope: ritualDayScope,
    mutationFn: (period: Period) => markRitualDone(localDate, period),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['completions', 'ritualDays', localDate] }),
  });

  useEffect(() => {
    if (pending) {
      for (const period of pending.split(',') as Period[]) {
        stamp(period);
      }
    }
  }, [pending, stamp, stamps.dataUpdatedAt]);
}

type ToggleVariables = { stepId: string; localDate: LocalDate; wasDone: boolean };

function setDone(queryClient: QueryClient, stepId: string, localDate: LocalDate, done: boolean) {
  queryClient.setQueryData<string[]>(['completions', localDate], (old) => {
    if (!old) {
      return old;
    }
    const others = old.filter((id) => id !== stepId);
    return done ? [...others, stepId] : others;
  });
}

// An untick removes the ritual's stamp first, so a failure can't leave a stamp on an unfinished ritual.
async function toggleStep(period: Period, { stepId, localDate, wasDone }: ToggleVariables) {
  if (wasDone) {
    await clearRitualDone(localDate, period);
    await uncompleteStep(stepId, localDate);
  } else {
    await completeStep(stepId, localDate);
  }
}

// One per row. Everything after the tap reads the variables, so a new day mid-save can't move the tick.
export function useToggleCompletion(stepId: string, period: Period, productId: string) {
  const queryClient = useQueryClient();
  const checkRunningLow = useRunningLowCheck();
  const mutationKey = ['toggleCompletion', stepId];
  const mutation = useMutation({
    mutationKey,
    scope: ritualDayScope,
    mutationFn: (variables: ToggleVariables) => toggleStep(period, variables),
    onMutate: async ({ stepId: id, localDate, wasDone }: ToggleVariables) => {
      await queryClient.cancelQueries({ queryKey: ['completions', localDate], exact: true });
      setDone(queryClient, id, localDate, !wasDone);
    },
    // Only a saved check can use up a bottle; the check never throws.
    onSuccess: (_data, { wasDone }) => {
      if (!wasDone) {
        void checkRunningLow(productId);
      }
    },
    // Only this row flips back, and the dialog shows even if the row has left the screen.
    onError: (error, { stepId: id, localDate, wasDone }) => {
      setDone(queryClient, id, localDate, wasDone);
      if (isStepGoneError(error)) {
        queryClient.invalidateQueries({ queryKey: ['routineSteps'], exact: true });
        Alert.alert('This step is no longer in your routine.');
      } else if (isOutsideDayError(error)) {
        Alert.alert("Couldn't save this step", "Check your phone's date and time, then try again.");
      } else {
        Alert.alert("Couldn't save this step", 'Check your connection and try again.');
      }
    },
    // Refetches once the last tick has settled (this one still counts itself), so an early refetch can't undo a later tick.
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: ['toggleCompletion'] }) === 1) {
        queryClient.invalidateQueries({ queryKey: ['completions'] });
      }
    },
  });

  // The direction and the guard come from the caches, so a tap before the next render, or after a remount, still reads the truth.
  function toggle(localDate: LocalDate) {
    if (queryClient.isMutating({ mutationKey }) > 0) {
      return;
    }
    const wasDone =
      queryClient.getQueryData<string[]>(['completions', localDate])?.includes(stepId) ?? false;
    mutation.mutate({ stepId, localDate, wasDone });
  }

  return toggle;
}
