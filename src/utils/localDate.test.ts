import {
  formatLocalDate,
  isValidLocalDate,
  parseLocalDate,
  toLocalDate,
  todayLocalDate,
} from '@/utils/localDate';

describe('toLocalDate', () => {
  it('uses the local calendar day, not the UTC one', () => {
    expect(toLocalDate(new Date(2026, 10, 3, 0, 30))).toBe('2026-11-03');
    expect(toLocalDate(new Date(2026, 10, 3, 23, 59))).toBe('2026-11-03');
  });

  it('pads months and days', () => {
    expect(toLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('rolls over at local midnight', () => {
    expect(toLocalDate(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31');
    expect(toLocalDate(new Date(2027, 0, 1, 0, 0, 0))).toBe('2027-01-01');
  });
});

describe('todayLocalDate', () => {
  it('formats the given moment as a local date', () => {
    expect(todayLocalDate(new Date(2026, 1, 28, 12))).toBe('2026-02-28');
  });
});

describe('isValidLocalDate', () => {
  it('accepts real calendar days', () => {
    expect(isValidLocalDate('2026-11-10')).toBe(true);
    expect(isValidLocalDate('2028-02-29')).toBe(true);
  });

  it('rejects impossible days and other formats', () => {
    expect(isValidLocalDate('2026-02-29')).toBe(false);
    expect(isValidLocalDate('2026-13-01')).toBe(false);
    expect(isValidLocalDate('2026-11-1')).toBe(false);
    expect(isValidLocalDate('2026-11-10T00:00:00Z')).toBe(false);
    expect(isValidLocalDate('')).toBe(false);
  });
});

describe('parseLocalDate', () => {
  it('returns local midnight of that day', () => {
    const date = parseLocalDate('2026-11-03');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([
      2026, 10, 3, 0,
    ]);
  });

  it('round-trips through toLocalDate', () => {
    expect(toLocalDate(parseLocalDate('2000-01-01'))).toBe('2000-01-01');
  });

  it('throws on an invalid value', () => {
    expect(() => parseLocalDate('2026-02-30')).toThrow();
  });
});

describe('formatLocalDate', () => {
  it('prints day, short month and year', () => {
    expect(formatLocalDate('2026-11-03')).toBe('3 Nov 2026');
    expect(formatLocalDate('2026-09-02')).toBe('2 Sep 2026');
    expect(formatLocalDate('2027-01-31')).toBe('31 Jan 2027');
  });
});
