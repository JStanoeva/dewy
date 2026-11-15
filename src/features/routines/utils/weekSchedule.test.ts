import {
  buildWeekStrip,
  describeWeekdays,
  formatWeekdays,
  isDaily,
  routineMeta,
  routineMinutes,
} from '@/features/routines/utils/weekSchedule';

const daily = [1, 2, 3, 4, 5, 6, 7];

function filledWeekdays(strip: ReturnType<typeof buildWeekStrip>) {
  return strip.days.filter((day) => day.filled).map((day) => day.weekday);
}

describe('isDaily', () => {
  it('needs all seven days, in any order', () => {
    expect(isDaily(daily)).toBe(true);
    expect(isDaily([7, 6, 5, 4, 3, 2, 1])).toBe(true);
    expect(isDaily([1, 2, 3, 4, 5, 6])).toBe(false);
  });
});

describe('buildWeekStrip', () => {
  it('fills every day when every step is daily', () => {
    const strip = buildWeekStrip([{ weekdays: daily }, { weekdays: daily }], 2, 'morning');
    expect(filledWeekdays(strip)).toEqual(daily);
  });

  it('fills only the days with extra steps when some steps are not daily', () => {
    const strip = buildWeekStrip([{ weekdays: daily }, { weekdays: [1, 3, 5] }], 2, 'evening');
    expect(filledWeekdays(strip)).toEqual([1, 3, 5]);
  });

  it('combines the days of several extra steps', () => {
    const strip = buildWeekStrip([{ weekdays: [1] }, { weekdays: [5, 6] }], 1, 'evening');
    expect(filledWeekdays(strip)).toEqual([1, 5, 6]);
  });

  it('names the legend for an all-daily ritual in each period', () => {
    expect(buildWeekStrip([{ weekdays: daily }], 1, 'morning').legend).toEqual({
      filled: 'Same steps every morning',
      basic: null,
    });
    expect(buildWeekStrip([{ weekdays: daily }], 1, 'evening').legend).toEqual({
      filled: 'Same steps every evening',
      basic: null,
    });
  });

  it('names the legend for a ritual with extra steps in each period', () => {
    const steps = [{ weekdays: daily }, { weekdays: [2, 4] }];
    expect(buildWeekStrip(steps, 1, 'morning').legend).toEqual({
      filled: 'Extra steps',
      basic: 'Basic morning',
    });
    expect(buildWeekStrip(steps, 1, 'evening').legend).toEqual({
      filled: 'Extra steps',
      basic: 'Basic night',
    });
  });

  it('labels the days Monday first', () => {
    const strip = buildWeekStrip([{ weekdays: daily }], 1, 'morning');
    expect(strip.days.map((day) => day.letter).join('')).toBe('MTWTFSS');
    expect(strip.days[6].name).toBe('Sunday');
  });

  it.each([1, 2, 3, 4, 5, 6, 7])('rings only today when today is weekday %i', (today) => {
    const strip = buildWeekStrip([{ weekdays: daily }], today, 'morning');
    expect(strip.days.filter((day) => day.isToday).map((day) => day.weekday)).toEqual([today]);
  });
});

describe('formatWeekdays', () => {
  it('names the common schedules', () => {
    expect(formatWeekdays(daily)).toBe('Daily');
    expect(formatWeekdays([1, 2, 3, 4, 5])).toBe('Weekdays');
    expect(formatWeekdays([7, 6])).toBe('Weekends');
  });

  it('lists other days Monday first, with two letters where one would be ambiguous', () => {
    expect(formatWeekdays([5, 1, 3])).toBe('M · W · F');
    expect(formatWeekdays([2, 4])).toBe('Tu · Th');
    expect(formatWeekdays([6])).toBe('Sa');
    expect(formatWeekdays([1, 2, 3, 4, 5, 6])).toBe('M · Tu · W · Th · F · Sa');
  });

  it('ignores repeated days', () => {
    expect(formatWeekdays([1, 1, 3])).toBe('M · W');
  });
});

describe('describeWeekdays', () => {
  it('reads the schedule in words', () => {
    expect(describeWeekdays(daily)).toBe('every day');
    expect(describeWeekdays([3])).toBe('Wednesday');
    expect(describeWeekdays([2, 4])).toBe('Tuesday and Thursday');
    expect(describeWeekdays([5, 1, 3])).toBe('Monday, Wednesday and Friday');
  });
});

describe('routineMinutes', () => {
  it('rounds the total up to whole minutes', () => {
    expect(routineMinutes([{ durationSeconds: 60, waitMinutes: null }])).toBe(1);
    expect(
      routineMinutes([
        { durationSeconds: 60, waitMinutes: null },
        { durationSeconds: 20, waitMinutes: null },
      ]),
    ).toBe(2);
    expect(routineMinutes([{ durationSeconds: 10, waitMinutes: null }])).toBe(1);
  });

  it('counts a wait only when another step follows it', () => {
    expect(
      routineMinutes([
        { durationSeconds: 60, waitMinutes: 10 },
        { durationSeconds: 45, waitMinutes: 5 },
      ]),
    ).toBe(12);
  });

  it('is 0 for an empty routine', () => {
    expect(routineMinutes([])).toBe(0);
  });
});

describe('routineMeta', () => {
  it('uses the singular for one step', () => {
    expect(routineMeta([{ durationSeconds: 600, waitMinutes: null }])).toBe(
      '1 step · about 10 min',
    );
  });

  it('adds the steps and the waits between them', () => {
    expect(
      routineMeta([
        { durationSeconds: 60, waitMinutes: null },
        { durationSeconds: 60, waitMinutes: null },
        { durationSeconds: 60, waitMinutes: 10 },
        { durationSeconds: 45, waitMinutes: null },
      ]),
    ).toBe('4 steps · about 14 min');
  });
});
