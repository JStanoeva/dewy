import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateNudges } from '@/features/profile/services/profileService';
import type { NudgeSettings, Profile } from '@/features/profile/types';

const nudgesKey = ['updateNudges'];
// A switch and a tile save one at a time, in the order they were changed; skin details join the same queue.
export const nudgesScope = { id: 'nudges' };

type NudgesVariables = { userId: string; nudges: Partial<NudgeSettings> };

// Changes show at once; useReminderSync reschedules from ['profile'] whenever it changes.
export function useUpdateNudges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: nudgesKey,
    mutationFn: ({ userId, nudges }: NudgesVariables) => updateNudges(userId, nudges),
    scope: nudgesScope,
    onMutate: async ({ nudges }) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      const old = queryClient.getQueryData<Profile>(['profile']);
      if (!old) {
        return undefined;
      }
      queryClient.setQueryData<Profile>(['profile'], { ...old, ...nudges });
      const before: Partial<NudgeSettings> = {};
      for (const field of Object.keys(nudges) as (keyof NudgeSettings)[]) {
        Object.assign(before, { [field]: old[field] });
      }
      return { before };
    },
    // Only the fields this change touched go back, so a later change saved in the meantime stays.
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData<Profile>(
          ['profile'],
          (profile) => profile && { ...profile, ...context.before },
        );
      }
    },
    // A refetch started during the save may still carry the old row; while another change waits, the saved row would undo it on screen.
    onSuccess: async (profile) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      if (queryClient.isMutating({ mutationKey: nudgesKey }) === 1) {
        queryClient.setQueryData(['profile'], profile);
      }
    },
  });
}
