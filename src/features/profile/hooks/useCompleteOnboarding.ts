import { useMutation, useQueryClient } from '@tanstack/react-query';

import { completeOnboarding } from '@/features/profile/services/profileService';
import type { Profile } from '@/features/profile/types';

// The root gate reads ['profile'], so writing the timestamp there swaps onboarding for the tabs.
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeOnboarding,
    // A refetch that started before the save would bring back the old null and reopen onboarding.
    onSuccess: async (onboardingCompletedAt) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      queryClient.setQueryData<Profile>(
        ['profile'],
        (old) => old && { ...old, onboardingCompletedAt },
      );
    },
  });
}
