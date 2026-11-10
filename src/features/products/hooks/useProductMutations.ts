import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createProduct } from '@/features/products/services/productService';

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    // Returning the refetch keeps the mutation pending until the Shelf list is fresh.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}
