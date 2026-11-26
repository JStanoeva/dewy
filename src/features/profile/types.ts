import type { SkinConcern, SkinGoal, SkinType } from '@/features/profile/constants';

export type Profile = {
  id: string;
  displayName: string;
  createdAt: string;
  // Optional skin details, in form order; unknown stored values are left out.
  skinType: SkinType | null;
  concerns: SkinConcern[];
  skinGoals: SkinGoal[];
  // Null until the account finishes or skips onboarding.
  onboardingCompletedAt: string | null;
  morningReminderEnabled: boolean;
  // 'HH:MM:SS', as the database returns a time.
  morningReminderTime: string;
  eveningReminderEnabled: boolean;
  eveningReminderTime: string;
  expiryAlertsEnabled: boolean;
  expiryLeadDays: number;
  lowAlertsEnabled: boolean;
  // Also what "running low" means on the Shelf and Details, whether or not the nudge is on.
  lowUsesThreshold: number;
};

// The four nudges' switches and choices, as onboarding step 3 saves them.
export type NudgeSettings = Pick<
  Profile,
  | 'morningReminderEnabled'
  | 'morningReminderTime'
  | 'eveningReminderEnabled'
  | 'eveningReminderTime'
  | 'expiryAlertsEnabled'
  | 'expiryLeadDays'
  | 'lowAlertsEnabled'
  | 'lowUsesThreshold'
>;
