import { useQuery } from '@tanstack/react-query';

import { listProducts } from '@/features/products/services/productService';

export function useProducts() {
  return useQuery({ queryKey: ['products'], queryFn: listProducts });
}
