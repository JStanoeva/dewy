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

// The clock's period (colours and greeting) and the ritual Today shows, with the slot they were set in.
export type ClockState = { clock: Period; ritual: Period; slot: string };

// A picked ritual holds until the clock moves into the next half-day; then both follow the clock again.
export function followClock(current: ClockState | null, now: Date = new Date()): ClockState {
  const slot = getClockSlot(now);
  if (current?.slot === slot) {
    return current;
  }
  const period = getClockPeriod(now);
  return { clock: period, ritual: period, slot };
}

// Picking a ritual never changes the colours: they come from the clock at that moment.
export function pickRitual(ritual: Period, now: Date = new Date()): ClockState {
  return { clock: getClockPeriod(now), ritual, slot: getClockSlot(now) };
}
