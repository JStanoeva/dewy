import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getRoutineStep, listRoutineSteps } from '@/features/routines/services/routineService';
import type { RoutineStep } from '@/features/routines/types';

export function useRoutineSteps() {
  return useQuery({ queryKey: ['routineSteps'], queryFn: listRoutineSteps });
}

// Starts from the steps list's copy when there is one, then refetches the single row.
export function useRoutineStep(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['routineSteps', id],
    queryFn: () => getRoutineStep(id),
    initialData: () =>
      queryClient.getQueryData<RoutineStep[]>(['routineSteps'])?.find((step) => step.id === id),
    initialDataUpdatedAt: () => queryClient.getQueryState(['routineSteps'])?.dataUpdatedAt,
  });
}
