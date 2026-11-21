import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { RoutineStepInput } from '@/features/routines/schemas/routineStepSchema';
import {
  addRoutineSteps,
  deleteRoutineStep,
  reorderRoutineSteps,
  updateRoutineStep,
} from '@/features/routines/services/routineService';
import type { RoutineStep } from '@/features/routines/types';
import type { Period } from '@/theme/period';

export function useAddRoutineSteps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addRoutineSteps,
    // Returning the refetch keeps Save busy until Routines, the Shelf tags and the Details chips are fresh.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routineSteps'], exact: true }),
    // A product added to a ritual or deleted elsewhere gets its lock or leaves the picker once the lists reload.
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['routineSteps'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['products'], exact: true });
    },
  });
}

type UpdateVariables = { id: string; input: RoutineStepInput };

export function useUpdateRoutineStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: UpdateVariables) => updateRoutineStep(id, input),
    // A null row means the step was removed elsewhere, which turns the editor into "not found".
    onSuccess: (step, { id }) => {
      queryClient.setQueryData(['routineSteps', id], step);
      if (step) {
        queryClient.setQueryData<RoutineStep[]>(['routineSteps'], (old) =>
          old?.map((item) => (item.id === id ? step : item)),
        );
      }
    },
    // Not awaited, so a failed save reports at once instead of after the refetch's retries.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['routineSteps'], exact: true });
    },
  });
}

// Never refetches or removes ['routineSteps', id]: either would make the closing editor flash "not found".
export function useRemoveRoutineStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRoutineStep,
    // The prefix also stops a by-id refetch that could bring back null once the step is gone.
    onMutate: () => queryClient.cancelQueries({ queryKey: ['routineSteps'] }),
    // The step's ticks stay, without their step, so the product keeps its counted uses.
    onSuccess: (_data, id) => {
      queryClient.setQueryData<RoutineStep[]>(['routineSteps'], (old) =>
        old?.filter((step) => step.id !== id),
      );
      queryClient.invalidateQueries({ queryKey: ['routineSteps'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['completions'] });
    },
  });
}

type MoveVariables = { period: Period; stepIds: string[] };

export function useMoveRoutineStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ period, stepIds }: MoveVariables) => reorderRoutineSteps(period, stepIds),
    // The list is filtered by period wherever it shows, so the period's steps can go last in the new order.
    onSuccess: (_data, { stepIds }) => {
      queryClient.setQueryData<RoutineStep[]>(['routineSteps'], (old) => {
        if (!old) {
          return old;
        }
        const moved = stepIds.flatMap((id, position) => {
          const step = old.find((item) => item.id === id);
          return step ? [{ ...step, position }] : [];
        });
        return [...old.filter((step) => !stepIds.includes(step.id)), ...moved];
      });
      queryClient.invalidateQueries({ queryKey: ['routineSteps'], exact: true });
    },
    // Not awaited, so the error shows at once; the prefix also turns a step removed elsewhere into "not found".
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['routineSteps'] });
    },
  });
}
