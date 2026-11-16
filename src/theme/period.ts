import { toLocalDate, type LocalDate } from '@/utils/localDate';

export type Period = 'morning' | 'evening';

const MORNING_STARTS_AT_HOUR = 5;
const EVENING_STARTS_AT_HOUR = 17;

export function getClockPeriod(date: Date = new Date()): Period {
  const hour = date.getHours();
  return hour >= MORNING_STARTS_AT_HOUR && hour < EVENING_STARTS_AT_HOUR ? 'morning' : 'evening';
}

// The ritual day turns over when morning starts, so evening steps ticked after midnight count for that evening.
export function getRitualDate(now: Date = new Date()): LocalDate {
  if (now.getHours() >= MORNING_STARTS_AT_HOUR) {
    return toLocalDate(now);
  }
  return toLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
}

// One half of a ritual day, e.g. "2026-11-16:evening"; a picked period holds until the clock moves into the next one.
export function getClockSlot(now: Date = new Date()): string {
  return `${getRitualDate(now)}:${getClockPeriod(now)}`;
}
