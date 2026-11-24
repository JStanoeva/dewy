import { useMutation, useQueryClient } from '@tanstack/react-query';

import { finishOnboarding } from '@/features/profile/services/profileService';
import type { Profile } from '@/features/profile/types';

// Saves step 2's rituals and step 3's nudges and finishes onboarding; the gate then swaps onboarding for the tabs.
export function useFinishOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: finishOnboarding,
    onSuccess: async (onboardingCompletedAt, { nudges }) => {
      queryClient.invalidateQueries({ queryKey: ['routineSteps'] });
      // A refetch that started before the save would bring back the old null and reopen onboarding.
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      queryClient.setQueryData<Profile>(
        ['profile'],
        (old) => old && { ...old, ...nudges, onboardingCompletedAt },
      );
    },
    // A product deleted elsewhere fails the save; the list is read again, so Back and Continue send fresh steps.
    onError: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}
