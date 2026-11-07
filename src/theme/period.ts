export type Period = 'morning' | 'evening';

const MORNING_STARTS_AT_HOUR = 5;
const EVENING_STARTS_AT_HOUR = 17;

export function getClockPeriod(date: Date = new Date()): Period {
  const hour = date.getHours();
  return hour >= MORNING_STARTS_AT_HOUR && hour < EVENING_STARTS_AT_HOUR ? 'morning' : 'evening';
}
