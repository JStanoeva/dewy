import {
  planReminders,
  reminderTime,
  type ReminderSettings,
} from '@/features/reminders/utils/planReminders';

const allOff: ReminderSettings = {
  morningReminderEnabled: false,
  morningReminderTime: '08:00:00',
  eveningReminderEnabled: false,
  eveningReminderTime: '21:30:00',
  expiryAlertsEnabled: false,
  expiryLeadDays: 14,
};

const serum = {
  id: 'serum',
  name: 'C-Bright Serum',
  status: 'owned' as const,
  openedOn: '2026-06-08',
  paoMonths: 6,
};

// 24 Nov 2026, 07:00 on the phone's clock.
const now = new Date(2026, 10, 24, 7, 0);

describe('reminderTime', () => {
  it('reads the hour and minute of a database time', () => {
    expect(reminderTime('08:00:00')).toEqual({ hour: 8, minute: 0 });
    expect(reminderTime('21:30:00')).toEqual({ hour: 21, minute: 30 });
  });
});

describe('planReminders', () => {
  it('plans nothing while every nudge is off', () => {
    expect(planReminders(allOff, [serum], now)).toEqual([]);
  });

  it('plans the ritual reminders daily at their times', () => {
    const plan = planReminders(
      { ...allOff, morningReminderEnabled: true, eveningReminderEnabled: true },
      [],
      now,
    );
    expect(plan.map((reminder) => [reminder.id, reminder.trigger])).toEqual([
      ['dewy-morning', { kind: 'daily', hour: 8, minute: 0 }],
      ['dewy-evening', { kind: 'daily', hour: 21, minute: 30 }],
    ]);
    expect(plan[0].content).toEqual({
      title: 'Morning ritual',
      body: 'Your morning steps are ready when you are.',
      data: { period: 'morning' },
    });
    expect(plan[1].content.data).toEqual({ period: 'evening' });
  });

  it('warns the lead before expiry, next to the morning reminder while it is on', () => {
    const plan = planReminders(
      { ...allOff, morningReminderEnabled: true, expiryAlertsEnabled: true },
      [serum],
      now,
    );
    // Opened 8 Jun with 6 months: expires 8 Dec, so two weeks before is 24 Nov.
    expect(plan[1]).toEqual({
      id: 'dewy-expiry-serum',
      content: {
        title: 'C-Bright Serum expires in 2 weeks',
        body: 'Best used by 8 Dec.',
        data: { productId: 'serum' },
      },
      trigger: { kind: 'once', date: new Date(2026, 10, 24, 8, 0) },
    });
  });

  it('warns at 9:00 while the morning reminder is off', () => {
    const plan = planReminders({ ...allOff, expiryAlertsEnabled: true }, [serum], now);
    expect(plan[0].trigger).toEqual({ kind: 'once', date: new Date(2026, 10, 24, 9, 0) });
  });

  it('skips a warning whose moment has passed', () => {
    const later = new Date(2026, 10, 24, 9, 0);
    expect(planReminders({ ...allOff, expiryAlertsEnabled: true }, [serum], later)).toEqual([]);
  });

  it('names each lead and counts calendar days back from a clamped month end', () => {
    const product = { ...serum, openedOn: '2026-08-31' };
    // 31 Aug plus 6 months is 28 Feb 2027.
    const month = planReminders(
      { ...allOff, expiryAlertsEnabled: true, expiryLeadDays: 30 },
      [product],
      now,
    );
    expect(month[0].content.title).toBe('C-Bright Serum expires in 1 month');
    expect(month[0].trigger).toEqual({ kind: 'once', date: new Date(2027, 0, 29, 9, 0) });
    const days = planReminders(
      { ...allOff, expiryAlertsEnabled: true, expiryLeadDays: 3 },
      [product],
      now,
    );
    expect(days[0].content.title).toBe('C-Bright Serum expires in 3 days');
    expect(days[0].trigger).toEqual({ kind: 'once', date: new Date(2027, 1, 25, 9, 0) });
    const week = planReminders(
      { ...allOff, expiryAlertsEnabled: true, expiryLeadDays: 7 },
      [product],
      now,
    );
    expect(week[0].content.title).toBe('C-Bright Serum expires in 1 week');
    expect(week[0].content.body).toBe('Best used by 28 Feb.');
  });

  it('leaves out wishlist and unopened products', () => {
    const products = [
      { ...serum, id: 'wish', status: 'wishlist' as const, openedOn: null, paoMonths: null },
      { ...serum, id: 'closed', openedOn: null },
    ];
    expect(planReminders({ ...allOff, expiryAlertsEnabled: true }, products, now)).toEqual([]);
  });
});
