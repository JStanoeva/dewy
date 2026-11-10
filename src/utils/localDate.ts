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

// Local midnight of the given day, for pickers and date arithmetic.
export function parseLocalDate(value: LocalDate): Date {
  if (!isValidLocalDate(value)) {
    throw new Error(`Invalid local date: ${value}`);
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// "3 Nov 2026", spelled out by hand so every device and test runner prints the same month names.
export function formatLocalDate(value: LocalDate): string {
  const date = parseLocalDate(value);
  return `${date.getDate()} ${shortMonths[date.getMonth()]} ${date.getFullYear()}`;
}
