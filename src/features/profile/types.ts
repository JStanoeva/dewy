export type Profile = {
  id: string;
  displayName: string;
  createdAt: string;
  // Null until the account finishes or skips onboarding.
  onboardingCompletedAt: string | null;
};
