import { useQuery } from '@tanstack/react-query';

import { getProfile } from '@/features/profile/services/profileService';

export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: getProfile });
}
