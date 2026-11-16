import type { RoutineStep } from '@/features/routines/types';
import type { Period } from '@/theme/period';
import { isoWeekday, type LocalDate } from '@/utils/localDate';

export type TodayStep = {
  step: RoutineStep;
  // Today's own numbering, 1, 2, 3, without the steps that fall on other days.
  number: number;
  done: boolean;
};

export type TodayRoutine = {
  steps: TodayStep[];
  done: number;
  total: number;
  minutesLeft: number;
  isComplete: boolean;
  // Every step of the ritual, whatever its days, so a day off can be told from an empty ritual.
  ritualStepCount: number;
};

// The ritual's steps that fall on the date's weekday, in Routines order, with the ticks applied.
export function buildTodayRoutine(
  steps: readonly RoutineStep[],
  completedStepIds: readonly string[],
  period: Period,
  date: LocalDate,
): TodayRoutine {
  const weekday = isoWeekday(date);
  const completed = new Set(completedStepIds);
  const ritualSteps = steps.filter((step) => step.period === period);
  const todaySteps = ritualSteps
    .filter((step) => step.weekdays.includes(weekday))
    .map((step, index) => ({ step, number: index + 1, done: completed.has(step.id) }));
  const done = todaySteps.filter((item) => item.done).length;
  // Only the steps' own times count, as the artboards do; waits between steps don't.
  const secondsLeft = todaySteps.reduce(
    (sum, item) => (item.done ? sum : sum + item.step.durationSeconds),
    0,
  );

  return {
    steps: todaySteps,
    done,
    total: todaySteps.length,
    minutesLeft: Math.max(1, Math.ceil(secondsLeft / 60)),
    isComplete: todaySteps.length > 0 && done === todaySteps.length,
    ritualStepCount: ritualSteps.length,
  };
}

export type TodayState = 'loading' | 'error' | 'list' | 'dayOff' | 'emptyRitual' | 'noProducts';

type TodayStateInput = {
  // Undefined until both the steps and the day's ticks have loaded.
  routine: TodayRoutine | undefined;
  routineFailed: boolean;
  // Undefined until the products have loaded; they only matter when the ritual has no steps.
  hasOwnedProducts: boolean | undefined;
  productsFailed: boolean;
};

export function todayState({
  routine,
  routineFailed,
  hasOwnedProducts,
  productsFailed,
}: TodayStateInput): TodayState {
  if (!routine) {
    return routineFailed ? 'error' : 'loading';
  }
  if (routine.total > 0) {
    return 'list';
  }
  if (routine.ritualStepCount > 0) {
    return 'dayOff';
  }
  if (hasOwnedProducts === undefined) {
    return productsFailed ? 'error' : 'loading';
  }
  return hasOwnedProducts ? 'emptyRitual' : 'noProducts';
}
