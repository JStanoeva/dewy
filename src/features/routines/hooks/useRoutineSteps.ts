import { useQuery } from '@tanstack/react-query';

import { listRoutineSteps } from '@/features/routines/services/routineService';

export function useRoutineSteps() {
  return useQuery({ queryKey: ['routineSteps'], queryFn: listRoutineSteps });
}
