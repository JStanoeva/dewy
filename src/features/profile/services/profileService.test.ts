import {
  finishOnboarding,
  getProfile,
  updateNudges,
  updateSkinDetails,
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
  skin_type: 'combination',
  concerns: ['sensitivity', 'dark_spots'],
  skin_goals: ['glow', 'even_tone'],
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
  skinType: 'combination',
  concerns: ['sensitivity', 'dark_spots'],
  skinGoals: ['glow', 'even_tone'],
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

  it('leaves out skin values it does not know and keeps the form order', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: {
              ...row,
              skin_type: 'balanced',
              concerns: ['dark_spots', 'pores', 'sensitivity'],
              skin_goals: ['smooth', 'glow'],
            },
            error: null,
          }),
      }),
    });
    const loaded = await getProfile();
    expect(loaded.skinType).toBeNull();
    expect(loaded.concerns).toEqual(['sensitivity', 'dark_spots']);
    expect(loaded.skinGoals).toEqual(['glow', 'smooth']);
  });
});

describe('updateSkinDetails', () => {
  it('sends all three columns and returns the saved profile', async () => {
    const calls = answerUpdateWith({
      ...row,
      skin_type: 'dry',
      concerns: [],
      skin_goals: ['calm'],
    });
    const saved = await updateSkinDetails('u1', {
      skinType: 'dry',
      concerns: [],
      skinGoals: ['calm'],
    });
    expect(calls.values).toEqual({ skin_type: 'dry', concerns: [], skin_goals: ['calm'] });
    expect(calls.filter).toEqual(['id', 'u1']);
    expect(saved).toEqual({ ...profile, skinType: 'dry', concerns: [], skinGoals: ['calm'] });
  });

  it('sends a cleared form as null and empty lists, so the old details go', async () => {
    const calls = answerUpdateWith({ ...row, skin_type: null, concerns: [], skin_goals: [] });
    await updateSkinDetails('u1', { skinType: null, concerns: [], skinGoals: [] });
    // The request body is JSON, so a field left undefined would be dropped and keep its old value.
    expect(JSON.parse(JSON.stringify(calls.values))).toEqual({
      skin_type: null,
      concerns: [],
      skin_goals: [],
    });
  });

  it('throws the error when the save fails', async () => {
    const error = { message: 'violates check constraint', code: '23514' };
    mockFrom.mockReturnValue({
      update: () => ({
        eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error }) }) }),
      }),
    });
    await expect(
      updateSkinDetails('u1', { skinType: null, concerns: [], skinGoals: [] }),
    ).rejects.toBe(error);
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
  it('saves the rituals and all eight nudges in one call', async () => {
    mockRpc.mockResolvedValue({ data: '2026-11-26T08:00:00+00:00', error: null });
    const finishedAt = await finishOnboarding({
      steps: [{ productId: 'p1', period: 'evening', durationSeconds: 45 }],
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
    expect(finishedAt).toBe('2026-11-26T08:00:00+00:00');
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('finish_onboarding', {
      p_steps: [{ product_id: 'p1', period: 'evening', duration_seconds: 45 }],
      p_morning_enabled: true,
      p_morning_time: '07:30:00',
      p_evening_enabled: false,
      p_evening_time: '22:00:00',
      p_expiry_enabled: true,
      p_expiry_lead_days: 7,
      p_low_enabled: true,
      p_low_threshold: 3,
    });
  });

  it('throws when the save fails', async () => {
    const error = { message: 'violates check constraint', code: '23514' };
    mockRpc.mockResolvedValue({ data: null, error });
    await expect(
      finishOnboarding({
        steps: [],
        nudges: {
          morningReminderEnabled: false,
          morningReminderTime: '08:00:00',
          eveningReminderEnabled: false,
          eveningReminderTime: '21:30:00',
          expiryAlertsEnabled: false,
          expiryLeadDays: 14,
          lowAlertsEnabled: false,
          lowUsesThreshold: 5,
        },
      }),
    ).rejects.toBe(error);
  });
});
