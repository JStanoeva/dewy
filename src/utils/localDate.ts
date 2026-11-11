// Day-based values are local calendar dates stored as 'YYYY-MM-DD', never UTC slices of an ISO string.
export type LocalDate = string;

const shortMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const localDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const millisecondsPerDay = 86_400_000;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function toLocalDate(date: Date): LocalDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayLocalDate(now: Date = new Date()): LocalDate {
  return toLocalDate(now);
}

export function isValidLocalDate(value: string): boolean {
  const match = localDatePattern.exec(value);
  if (!match) {
    return false;
  }
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function dateParts(value: LocalDate): [year: number, month: number, day: number] {
  if (!isValidLocalDate(value)) {
    throw new Error(`Invalid local date: ${value}`);
  }
  const [year, month, day] = value.split('-').map(Number);
  return [year, month, day];
}

// Local midnight of the given day, for pickers and date arithmetic.
export function parseLocalDate(value: LocalDate): Date {
  const [year, month, day] = dateParts(value);
  return new Date(year, month - 1, day);
}

// Whole days between two dates, from UTC day numbers so DST's 23- and 25-hour days can't skew it.
export function daysBetween(from: LocalDate, to: LocalDate): number {
  const [fromYear, fromMonth, fromDay] = dateParts(from);
  const [toYear, toMonth, toDay] = dateParts(to);
  return (
    (Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) /
    millisecondsPerDay
  );
}

// Calendar months later, clamped to the month end: 31 Aug plus 6 months is 28 Feb, not 3 Mar.
export function addMonths(value: LocalDate, months: number): LocalDate {
  const [year, month, day] = dateParts(value);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const targetYear = target.getUTCFullYear();
  const targetMonth = target.getUTCMonth();
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return `${targetYear}-${pad(targetMonth + 1)}-${pad(Math.min(day, lastDay))}`;
}

// "3 Nov 2026", spelled out by hand so every device and test runner prints the same month names.
export function formatLocalDate(value: LocalDate): string {
  const [year, month, day] = dateParts(value);
  return `${day} ${shortMonths[month - 1]} ${year}`;
}

// "3 Nov", for short labels such as "Saved 3 Nov".
export function formatDayMonth(value: LocalDate): string {
  const [, month, day] = dateParts(value);
  return `${day} ${shortMonths[month - 1]}`;
}
