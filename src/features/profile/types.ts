export type Profile = {
  id: string;
  displayName: string;
  createdAt: string;
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
