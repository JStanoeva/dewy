import { useQuery } from '@tanstack/react-query';

import { getProfile } from '@/features/profile/services/profileService';

// The root gate passes false while signed out, so no request runs without a session.
export function useProfile(enabled = true) {
  return useQuery({ queryKey: ['profile'], queryFn: getProfile, enabled });
}
