import { useQuery } from '@tanstack/react-query';

import { getPhotoUrl } from '@/features/products/services/productPhotoService';

const linkRefresh = 50 * 60 * 1000;

// Signed links last an hour, so they are renewed after 50 minutes, also while a screen stays open.
export function usePhotoUrl(path: string) {
  return useQuery({
    queryKey: ['photoUrl', path],
    queryFn: () => getPhotoUrl(path),
    staleTime: linkRefresh,
    refetchInterval: linkRefresh,
    gcTime: 55 * 60 * 1000,
    retry: 1,
  });
}
