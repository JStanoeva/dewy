import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import type { ProductInput } from '@/features/products/schemas/productSchema';
import { lookupBarcode } from '@/features/products/services/barcodeLookupService';
import {
  createProduct,
  deleteProduct,
  moveProductToShelf,
  setProductFavorite,
  updateProduct,
} from '@/features/products/services/productService';
import type { Product } from '@/features/products/types';

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    // Returning the refetch keeps the mutation pending until the Shelf list is fresh.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

// No callbacks here: they would also run for lookups a rescan, Remove or Save has replaced.
export function useBarcodeLookup() {
  return useMutation({ mutationFn: lookupBarcode });
}

// The saved row the server sends back goes straight into Details and the Shelf list.
function storeProduct(queryClient: QueryClient, product: Product) {
  queryClient.setQueryData(['products', product.id], product);
  queryClient.setQueryData<Product[]>(['products'], (old) =>
    old?.map((item) => (item.id === product.id ? product : item)),
  );
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductInput }) => updateProduct(id, input),
    onSuccess: (product) => storeProduct(queryClient, product),
    // Not awaited, so a failed save reports at once instead of after the refetch's retries.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useMoveToShelf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moveProductToShelf,
    onSuccess: (product) => storeProduct(queryClient, product),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

type FavoriteVariables = { id: string; isFavorite: boolean };

// The heart fills before the server answers; Details' copy is never refetched, so a delete can't race it.
export function useSetFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavorite }: FavoriteVariables) => setProductFavorite(id, isFavorite),
    onMutate: async ({ id, isFavorite }: FavoriteVariables) => {
      await queryClient.cancelQueries({ queryKey: ['products', id], exact: true });
      queryClient.setQueryData<Product | null>(['products', id], (old) =>
        old ? { ...old, isFavorite } : old,
      );
    },
    // Only the heart flips back, so an edit or move saved in the meantime stays.
    onError: (_error, { id, isFavorite }) => {
      queryClient.setQueryData<Product | null>(['products', id], (old) =>
        old ? { ...old, isFavorite: !isFavorite } : old,
      );
    },
    onSuccess: (product) => storeProduct(queryClient, product),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'], exact: true });
    },
  });
}

// Never refetches or removes ['products', id]: either would make the open Details flash "not found".
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    // The Shelf under Details drops the row first, so it is already gone when Details slides away.
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previous = queryClient.getQueryData<Product[]>(['products']);
      queryClient.setQueryData<Product[]>(['products'], (old) =>
        old?.filter((product) => product.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(['products'], context?.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'], exact: true });
    },
  });
}
