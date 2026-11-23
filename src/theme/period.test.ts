import { followClock, getClockSlot, getRitualDate, pickRitual } from './period';

describe('followClock', () => {
  it('starts the colours and the ritual from the clock', () => {
    expect(followClock(null, new Date(2026, 10, 23, 16, 59))).toEqual({
      clock: 'morning',
      ritual: 'morning',
      slot: '2026-11-23:morning',
    });
    expect(followClock(null, new Date(2026, 10, 23, 17, 0))).toEqual({
      clock: 'evening',
      ritual: 'evening',
      slot: '2026-11-23:evening',
    });
  });

  it('keeps a picked ritual within the same half-day', () => {
    const picked = pickRitual('evening', new Date(2026, 10, 23, 10, 0));
    expect(followClock(picked, new Date(2026, 10, 23, 16, 30))).toBe(picked);
  });

  it('moves both to the clock once the half-day changes', () => {
    const picked = pickRitual('evening', new Date(2026, 10, 23, 10, 0));
    expect(followClock(picked, new Date(2026, 10, 23, 17, 0))).toEqual({
      clock: 'evening',
      ritual: 'evening',
      slot: '2026-11-23:evening',
    });
    const night = pickRitual('morning', new Date(2026, 10, 23, 23, 0));
    expect(followClock(night, new Date(2026, 10, 24, 5, 0))).toEqual({
      clock: 'morning',
      ritual: 'morning',
      slot: '2026-11-24:morning',
    });
  });
});

describe('pickRitual', () => {
  it('changes the ritual but never the colours', () => {
    expect(pickRitual('evening', new Date(2026, 10, 23, 10, 0))).toEqual({
      clock: 'morning',
      ritual: 'evening',
      slot: '2026-11-23:morning',
    });
    expect(pickRitual('morning', new Date(2026, 10, 23, 21, 0))).toEqual({
      clock: 'evening',
      ritual: 'morning',
      slot: '2026-11-23:evening',
    });
  });

  it('keeps a late-night pick in the evening before', () => {
    expect(pickRitual('morning', new Date(2026, 10, 24, 1, 0))).toEqual({
      clock: 'evening',
      ritual: 'morning',
      slot: '2026-11-23:evening',
    });
  });
});

describe('getClockSlot', () => {
  it('is the same within one half of a ritual day', () => {
    expect(getClockSlot(new Date(2026, 10, 16, 10, 0))).toBe(
      getClockSlot(new Date(2026, 10, 16, 12, 0)),
    );
    expect(getClockSlot(new Date(2026, 10, 16, 23, 30))).toBe(
      getClockSlot(new Date(2026, 10, 17, 0, 30)),
    );
    expect(getClockSlot(new Date(2026, 10, 16, 23, 30))).toBe('2026-11-16:evening');
  });

  it('changes when the half changes', () => {
    expect(getClockSlot(new Date(2026, 10, 17, 4, 59))).toBe('2026-11-16:evening');
    expect(getClockSlot(new Date(2026, 10, 17, 5, 0))).toBe('2026-11-17:morning');
    expect(getClockSlot(new Date(2026, 10, 17, 16, 59))).not.toBe(
      getClockSlot(new Date(2026, 10, 17, 17, 0)),
    );
  });

  it('changes for the same half on the next ritual day', () => {
    expect(getClockSlot(new Date(2026, 10, 16, 10, 0))).not.toBe(
      getClockSlot(new Date(2026, 10, 17, 10, 0)),
    );
    expect(getClockSlot(new Date(2026, 10, 16, 18, 0))).not.toBe(
      getClockSlot(new Date(2026, 10, 17, 18, 0)),
    );
  });
});

describe('getRitualDate', () => {
  it('is the calendar day from 05:00', () => {
    expect(getRitualDate(new Date(2026, 10, 16, 5, 0))).toBe('2026-11-16');
    expect(getRitualDate(new Date(2026, 10, 16, 23, 59))).toBe('2026-11-16');
  });

  it('stays on the evening before until 04:59', () => {
    expect(getRitualDate(new Date(2026, 10, 17, 0, 0))).toBe('2026-11-16');
    expect(getRitualDate(new Date(2026, 10, 17, 4, 59))).toBe('2026-11-16');
  });

  it('goes back across month and year ends', () => {
    expect(getRitualDate(new Date(2026, 11, 1, 0, 30))).toBe('2026-11-30');
    expect(getRitualDate(new Date(2027, 0, 1, 3, 0))).toBe('2026-12-31');
    expect(getRitualDate(new Date(2028, 2, 1, 1, 0))).toBe('2028-02-29');
  });

  it('is not shifted by a DST night', () => {
    expect(getRitualDate(new Date(2026, 2, 29, 4, 30))).toBe('2026-03-28');
    expect(getRitualDate(new Date(2026, 9, 25, 4, 30))).toBe('2026-10-24');
  });
});
