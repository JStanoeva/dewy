import {
  addMonths,
  daysBetween,
  formatDayMonth,
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

describe('formatDayMonth', () => {
  it('prints day and short month', () => {
    expect(formatDayMonth('2026-10-12')).toBe('12 Oct');
    expect(formatDayMonth('2027-01-01')).toBe('1 Jan');
  });
});

describe('daysBetween', () => {
  it('counts whole calendar days, negative when going back', () => {
    expect(daysBetween('2026-11-11', '2026-11-25')).toBe(14);
    expect(daysBetween('2026-11-25', '2026-11-11')).toBe(-14);
    expect(daysBetween('2026-11-11', '2026-11-11')).toBe(0);
  });

  it('is not skewed by DST changes', () => {
    expect(daysBetween('2026-03-29', '2026-03-30')).toBe(1);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(daysBetween('2026-01-10', '2026-07-10')).toBe(181);
  });

  it('crosses year ends and leap days', () => {
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
  });
});

describe('addMonths', () => {
  it('keeps the day of the month when it exists', () => {
    expect(addMonths('2026-09-02', 6)).toBe('2027-03-02');
    expect(addMonths('2026-11-10', 3)).toBe('2027-02-10');
    expect(addMonths('2026-11-10', 24)).toBe('2028-11-10');
  });

  it('clamps to the last day of a shorter month', () => {
    expect(addMonths('2026-08-31', 6)).toBe('2027-02-28');
    expect(addMonths('2026-08-30', 6)).toBe('2027-02-28');
    expect(addMonths('2026-11-30', 3)).toBe('2027-02-28');
    expect(addMonths('2026-08-31', 3)).toBe('2026-11-30');
    expect(addMonths('2026-12-31', 6)).toBe('2027-06-30');
    expect(addMonths('2026-01-31', 3)).toBe('2026-04-30');
  });

  it('handles leap years', () => {
    expect(addMonths('2027-11-30', 3)).toBe('2028-02-29');
    expect(addMonths('2028-02-29', 12)).toBe('2029-02-28');
    expect(addMonths('2028-02-29', 24)).toBe('2030-02-28');
    expect(addMonths('2028-02-29', 6)).toBe('2028-08-29');
  });

  it('throws on an invalid date', () => {
    expect(() => addMonths('2026-02-30', 3)).toThrow();
  });
});
