import {
  finishOnboarding,
  getProfile,
  updateNudges,
} from '@/features/profile/services/profileService';

const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
    rpc: (name: string, args: unknown) => mockRpc(name, args),
  },
}));

const row = {
  id: 'u1',
  display_name: 'Boopsicle',
  created_at: '2026-11-01T09:00:00+00:00',
  onboarding_completed_at: '2026-11-01T09:05:00+00:00',
  morning_reminder_enabled: true,
  morning_reminder_time: '08:00:00',
  evening_reminder_enabled: false,
  evening_reminder_time: '21:30:00',
  expiry_alerts_enabled: true,
  expiry_lead_days: 14,
  low_alerts_enabled: false,
  low_uses_threshold: 5,
};

const profile = {
  id: 'u1',
  displayName: 'Boopsicle',
  createdAt: '2026-11-01T09:00:00+00:00',
  onboardingCompletedAt: '2026-11-01T09:05:00+00:00',
  morningReminderEnabled: true,
  morningReminderTime: '08:00:00',
  eveningReminderEnabled: false,
  eveningReminderTime: '21:30:00',
  expiryAlertsEnabled: true,
  expiryLeadDays: 14,
  lowAlertsEnabled: false,
  lowUsesThreshold: 5,
};

// Records the update's values and filter, and answers its select with the given row.
function answerUpdateWith(answer: object) {
  const calls: { values?: object; filter?: [string, string] } = {};
  mockFrom.mockReturnValue({
    update: (values: object) => {
      calls.values = values;
      return {
        eq: (column: string, value: string) => {
          calls.filter = [column, value];
          return {
            select: () => ({ single: () => Promise.resolve({ data: answer, error: null }) }),
          };
        },
      };
    },
  });
  return calls;
}

beforeEach(() => {
  mockFrom.mockReset();
  mockRpc.mockReset();
});

describe('getProfile', () => {
  it('maps the row to the profile', async () => {
    mockFrom.mockReturnValue({
      select: () => ({ single: () => Promise.resolve({ data: row, error: null }) }),
    });
    await expect(getProfile()).resolves.toEqual(profile);
  });
});

describe('updateNudges', () => {
  it('sends only the changed column and returns the saved profile', async () => {
    const calls = answerUpdateWith({ ...row, evening_reminder_enabled: true });
    const saved = await updateNudges('u1', { eveningReminderEnabled: true });
    // The request body is JSON, which leaves out the fields that weren't changed.
    expect(JSON.parse(JSON.stringify(calls.values))).toEqual({ evening_reminder_enabled: true });
    expect(calls.filter).toEqual(['id', 'u1']);
    expect(saved).toEqual({ ...profile, eveningReminderEnabled: true });
  });

  it('maps a choice to its column', async () => {
    const calls = answerUpdateWith({ ...row, low_uses_threshold: 10 });
    await updateNudges('u1', { lowUsesThreshold: 10 });
    expect(JSON.parse(JSON.stringify(calls.values))).toEqual({ low_uses_threshold: 10 });
  });

  it('throws the error when the row is not saved', async () => {
    const error = { code: 'PGRST116', message: 'no rows' };
    mockFrom.mockReturnValue({
      update: () => ({
        eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error }) }) }),
      }),
    });
    await expect(updateNudges('u1', { morningReminderEnabled: false })).rejects.toBe(error);
  });
});

describe('finishOnboarding', () => {
  it('saves all eight nudge columns before the rituals', async () => {
    const calls = answerUpdateWith({ id: 'u1' });
    mockRpc.mockResolvedValue({ data: '2026-11-26T08:00:00+00:00', error: null });
    await finishOnboarding({
      userId: 'u1',
      steps: [],
      nudges: {
        morningReminderEnabled: true,
        morningReminderTime: '07:30:00',
        eveningReminderEnabled: false,
        eveningReminderTime: '22:00:00',
        expiryAlertsEnabled: true,
        expiryLeadDays: 7,
        lowAlertsEnabled: true,
        lowUsesThreshold: 3,
      },
    });
    expect(calls.values).toEqual({
      morning_reminder_enabled: true,
      morning_reminder_time: '07:30:00',
      evening_reminder_enabled: false,
      evening_reminder_time: '22:00:00',
      expiry_alerts_enabled: true,
      expiry_lead_days: 7,
      low_alerts_enabled: true,
      low_uses_threshold: 3,
    });
    expect(mockRpc).toHaveBeenCalledWith('finish_onboarding', { p_steps: [] });
  });
});
