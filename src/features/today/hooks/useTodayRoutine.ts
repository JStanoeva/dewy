import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { useRoutineSteps } from '@/features/routines/hooks/useRoutineSteps';
import {
  completeStep,
  isStepGoneError,
  listCompletedStepIds,
  uncompleteStep,
} from '@/features/today/services/completionService';
import { buildTodayRoutine } from '@/features/today/utils/buildTodayRoutine';
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

// One per row. Everything after the tap reads the variables, so a new day mid-save can't move the tick.
export function useToggleCompletion(stepId: string) {
  const queryClient = useQueryClient();
  const mutationKey = ['toggleCompletion', stepId];
  const mutation = useMutation({
    mutationKey,
    mutationFn: ({ stepId: id, localDate, wasDone }: ToggleVariables) =>
      wasDone ? uncompleteStep(id, localDate) : completeStep(id, localDate),
    onMutate: async ({ stepId: id, localDate, wasDone }: ToggleVariables) => {
      await queryClient.cancelQueries({ queryKey: ['completions', localDate], exact: true });
      setDone(queryClient, id, localDate, !wasDone);
    },
    // Only this row flips back, and the dialog shows even if the row has left the screen.
    onError: (error, { stepId: id, localDate, wasDone }) => {
      setDone(queryClient, id, localDate, wasDone);
      if (isStepGoneError(error)) {
        queryClient.invalidateQueries({ queryKey: ['routineSteps'], exact: true });
        Alert.alert('This step is no longer in your routine.');
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
