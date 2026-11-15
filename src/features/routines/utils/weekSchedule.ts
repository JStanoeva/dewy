import type { RoutineStep } from '@/features/routines/types';
import type { Period } from '@/theme/period';

export const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
// One letter where it is unambiguous, two where T and S would be.
const chipDays = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'] as const;
export const dayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

function scheduledDays(weekdays: readonly number[]): number[] {
  return [1, 2, 3, 4, 5, 6, 7].filter((weekday) => weekdays.includes(weekday));
}

export function isDaily(weekdays: readonly number[]): boolean {
  return scheduledDays(weekdays).length === 7;
}

// When every step is daily, every day is filled; otherwise only the days with extra steps are.
export function buildWeekStrip(
  steps: readonly Pick<RoutineStep, 'weekdays'>[],
  todayWeekday: number,
  period: Period,
) {
  const extraSteps = steps.filter((step) => !isDaily(step.weekdays));
  return {
    // The filled dot's label, and the empty ring's when only some days have extra steps.
    legend:
      extraSteps.length === 0
        ? { filled: `Same steps every ${period}`, basic: null }
        : { filled: 'Extra steps', basic: period === 'morning' ? 'Basic morning' : 'Basic night' },
    days: dayLetters.map((letter, index) => {
      const weekday = index + 1;
      return {
        weekday,
        letter,
        name: dayNames[index],
        filled:
          extraSteps.length === 0 || extraSteps.some((step) => step.weekdays.includes(weekday)),
        isToday: weekday === todayWeekday,
      };
    }),
  };
}

// "Daily", "Weekdays", "Weekends", or the days themselves: "M · W · F".
export function formatWeekdays(weekdays: readonly number[]): string {
  const days = scheduledDays(weekdays);
  if (days.length === 7) {
    return 'Daily';
  }
  if (days.join() === '1,2,3,4,5') {
    return 'Weekdays';
  }
  if (days.join() === '6,7') {
    return 'Weekends';
  }
  return days.map((weekday) => chipDays[weekday - 1]).join(' · ');
}

// The same schedule in words for TalkBack: "every day", "Monday, Wednesday and Friday".
export function describeWeekdays(weekdays: readonly number[]): string {
  const days = scheduledDays(weekdays);
  if (days.length === 7) {
    return 'every day';
  }
  const names = days.map((weekday) => dayNames[weekday - 1]);
  const last = names.pop();
  return names.length === 0 ? `${last}` : `${names.join(', ')} and ${last}`;
}

// The routine's time in whole minutes, rounded up; a wait only counts when another step follows it.
export function routineMinutes(
  steps: readonly Pick<RoutineStep, 'durationSeconds' | 'waitMinutes'>[],
): number {
  const seconds = steps.reduce(
    (total, step, index) =>
      total + step.durationSeconds + (index < steps.length - 1 ? (step.waitMinutes ?? 0) * 60 : 0),
    0,
  );
  return Math.ceil(seconds / 60);
}

export function routineMeta(
  steps: readonly Pick<RoutineStep, 'durationSeconds' | 'waitMinutes'>[],
): string {
  const count = `${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`;
  return `${count} · about ${routineMinutes(steps)} min`;
}
