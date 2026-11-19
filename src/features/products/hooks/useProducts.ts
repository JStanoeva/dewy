import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getProduct,
  listProductUses,
  listProducts,
} from '@/features/products/services/productService';
import type { Product } from '@/features/products/types';

export function useProducts() {
  return useQuery({ queryKey: ['products'], queryFn: listProducts });
}

// Under ['completions'], so every tick, untick and product delete refreshes the counts.
export function useProductUses() {
  return useQuery({ queryKey: ['completions', 'productUses'], queryFn: listProductUses });
}

// Starts from the Shelf list's copy when there is one, then refetches the single row.
export function useProduct(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
    initialData: () =>
      queryClient.getQueryData<Product[]>(['products'])?.find((product) => product.id === id),
    initialDataUpdatedAt: () => queryClient.getQueryState(['products'])?.dataUpdatedAt,
  });
}
