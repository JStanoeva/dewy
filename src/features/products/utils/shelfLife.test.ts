import { getShelfLife, savedLabel } from '@/features/products/utils/shelfLife';

// Opened 25 May 2026 with a 6-month PAO: expires 25 Nov 2026, 184 days in total.
function retinal(today: string) {
  return getShelfLife('2026-05-25', 6, today);
}

describe('getShelfLife', () => {
  it('has no shelf life while unopened', () => {
    expect(getShelfLife(null, null, '2026-11-11')).toBeNull();
    expect(getShelfLife(null, 12, '2026-11-11')).toBeNull();
  });

  it('computes expiry, days left and progress', () => {
    const shelfLife = retinal('2026-11-11');
    expect(shelfLife).toMatchObject({
      expiresOn: '2026-11-25',
      daysLeft: 14,
      totalDays: 184,
      label: 'Use within 2 weeks',
      isExpiringSoon: true,
    });
    expect(shelfLife?.progress).toBeCloseTo(14 / 184, 5);
  });

  it.each([
    ['2026-11-26', -1, 'Expired', true],
    ['2026-11-25', 0, 'Expires today', true],
    ['2026-11-24', 1, 'Use within 1 day', true],
    ['2026-11-19', 6, 'Use within 6 days', true],
    ['2026-11-18', 7, 'Use within 1 week', true],
    ['2026-11-17', 8, 'Use within 2 weeks', true],
    ['2026-11-10', 15, 'Use within 3 weeks', true],
    ['2026-11-03', 22, 'Use within 4 weeks', true],
    ['2026-10-28', 28, 'Use within 4 weeks', true],
    ['2026-10-27', 29, 'Use within 4 weeks', true],
    ['2026-10-26', 30, 'Use within 4 weeks', true],
    ['2026-10-25', 31, '1 month left', false],
    ['2026-10-11', 45, '1 month left', false],
    ['2026-10-10', 46, '2 months left', false],
  ])('on %s (%i days left) reads "%s"', (today, daysLeft, label, isExpiringSoon) => {
    expect(retinal(today)).toMatchObject({ daysLeft, label, isExpiringSoon });
  });

  it('keeps an expired product at zero progress', () => {
    expect(retinal('2027-01-01')?.progress).toBe(0);
    expect(getShelfLife('2025-12-01', 6, '2026-11-11')).toMatchObject({
      daysLeft: -163,
      label: 'Expired',
      progress: 0,
    });
  });

  it.each([
    [3, 92, '3 months left'],
    [6, 181, '6 months left'],
    [12, 365, '12 months left'],
    [24, 731, '24 months left'],
  ])('shows the full %i-month PAO on the opening day', (paoMonths, daysLeft, label) => {
    expect(getShelfLife('2026-11-10', paoMonths, '2026-11-10')).toMatchObject({
      daysLeft,
      label,
      progress: 1,
    });
  });

  it.each([
    [3, 91, '3 months left'],
    [6, 180, '6 months left'],
    [12, 364, '12 months left'],
    [24, 730, '24 months left'],
  ])('still shows the full %i months the day after opening', (paoMonths, daysLeft, label) => {
    expect(getShelfLife('2026-11-10', paoMonths, '2026-11-11')).toMatchObject({ daysLeft, label });
  });

  it('rounds months like the approved artboards', () => {
    expect(getShelfLife('2026-09-02', 6, '2026-11-03')).toMatchObject({
      daysLeft: 119,
      totalDays: 181,
      label: '4 months left',
    });
    expect(getShelfLife('2026-02-01', 3, '2026-02-01')).toMatchObject({
      daysLeft: 89,
      label: '3 months left',
    });
  });

  it('clamps the expiry to the month end', () => {
    expect(getShelfLife('2026-08-31', 6, '2026-11-11')).toMatchObject({
      expiresOn: '2027-02-28',
      daysLeft: 109,
      totalDays: 181,
      label: '4 months left',
    });
    expect(getShelfLife('2026-08-31', 6, '2027-02-28')?.label).toBe('Expires today');
    expect(getShelfLife('2026-08-31', 6, '2027-03-01')?.label).toBe('Expired');
    expect(getShelfLife('2026-11-30', 3, '2027-02-27')).toMatchObject({
      expiresOn: '2027-02-28',
      label: 'Use within 1 day',
    });
  });

  it('handles leap days', () => {
    expect(getShelfLife('2027-11-30', 3, '2028-02-29')).toMatchObject({
      expiresOn: '2028-02-29',
      label: 'Expires today',
    });
    expect(getShelfLife('2028-02-29', 12, '2028-02-29')).toMatchObject({
      expiresOn: '2029-02-28',
      daysLeft: 365,
      label: '12 months left',
    });
    expect(getShelfLife('2028-02-29', 12, '2029-02-28')).toMatchObject({
      daysLeft: 0,
      label: 'Expires today',
      progress: 0,
    });
  });

  it('counts whole days across DST changes', () => {
    expect(getShelfLife('2025-10-01', 6, '2026-03-28')).toMatchObject({
      daysLeft: 4,
      label: 'Use within 4 days',
    });
    expect(getShelfLife('2026-04-26', 6, '2026-10-24')).toMatchObject({
      daysLeft: 2,
      label: 'Use within 2 days',
    });
  });

  it('caps progress at full when the opened date is after today', () => {
    expect(getShelfLife('2026-11-12', 6, '2026-11-11')).toMatchObject({
      daysLeft: 182,
      totalDays: 181,
      progress: 1,
      label: '6 months left',
    });
  });
});

describe('savedLabel', () => {
  it('uses the local calendar day of the timestamp', () => {
    expect(savedLabel(new Date(2026, 10, 11, 1, 30).toISOString(), '2026-11-11')).toBe(
      'Saved 11 Nov',
    );
    expect(savedLabel(new Date(2026, 9, 12, 23, 59).toISOString(), '2026-11-11')).toBe(
      'Saved 12 Oct',
    );
  });

  it('adds the year only for an earlier year', () => {
    expect(savedLabel(new Date(2025, 7, 19, 12).toISOString(), '2026-11-11')).toBe(
      'Saved 19 Aug 2025',
    );
    expect(savedLabel(new Date(2026, 0, 1, 12).toISOString(), '2026-12-31')).toBe('Saved 1 Jan');
  });
});
