import { useMutation, useQueryClient } from '@tanstack/react-query';

import { nudgesScope } from '@/features/profile/hooks/useUpdateNudges';
import type { SkinDetails } from '@/features/profile/schemas/skinDetailsSchema';
import { updateSkinDetails } from '@/features/profile/services/profileService';
import type { Profile } from '@/features/profile/types';

type SkinDetailsVariables = { userId: string; details: SkinDetails };

// Queued behind any nudge still saving, so that nudge's returned row can't put the old details back.
export function useUpdateSkinDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, details }: SkinDetailsVariables) => updateSkinDetails(userId, details),
    scope: nudgesScope,
    // Cancels a refetch that may still carry the old details, and touches only these three fields, so a nudge changed meanwhile stays.
    onSuccess: async (saved) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      queryClient.setQueryData<Profile>(['profile'], (profile) =>
        profile
          ? {
              ...profile,
              skinType: saved.skinType,
              concerns: saved.concerns,
              skinGoals: saved.skinGoals,
            }
          : saved,
      );
    },
  });
}
