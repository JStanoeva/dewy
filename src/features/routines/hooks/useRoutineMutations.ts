import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Category } from '@/features/products/constants';
import { addProductToRoutines } from '@/features/routines/services/routineService';
import type { Period } from '@/theme/period';

type AddVariables = { productId: string; category: Category; periods: readonly Period[] };

export function useAddProductToRoutines() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, category, periods }: AddVariables) =>
      addProductToRoutines(productId, category, periods),
    // Refetches a cached list even when no screen shows it, and the form waits for it.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['routineSteps'], refetchType: 'all' }),
  });
}
