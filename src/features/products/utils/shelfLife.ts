import {
  addMonths,
  daysBetween,
  formatDayMonth,
  toLocalDate,
  type LocalDate,
} from '@/utils/localDate';

export type ShelfLife = {
  expiresOn: LocalDate;
  daysLeft: number;
  totalDays: number;
  progress: number;
  label: string;
  isExpiringSoon: boolean;
};

const expiringSoonDays = 30;
const averageMonthDays = 30.44;

function countLabel(count: number, unit: string) {
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

function shelfLifeLabel(daysLeft: number) {
  if (daysLeft < 0) {
    return 'Expired';
  }
  if (daysLeft === 0) {
    return 'Expires today';
  }
  if (daysLeft < 7) {
    return `Use within ${countLabel(daysLeft, 'day')}`;
  }
  if (daysLeft <= expiringSoonDays) {
    // Capped at 4, so 30 days never reads longer than the "1 month left" shown the day before.
    return `Use within ${countLabel(Math.min(4, Math.ceil(daysLeft / 7)), 'week')}`;
  }
  return `${countLabel(Math.round(daysLeft / averageMonthDays), 'month')} left`;
}

export function getShelfLife(
  openedOn: LocalDate | null,
  paoMonths: number | null,
  today: LocalDate,
): ShelfLife | null {
  if (openedOn === null || paoMonths === null) {
    return null;
  }
  const expiresOn = addMonths(openedOn, paoMonths);
  const daysLeft = daysBetween(today, expiresOn);
  const totalDays = daysBetween(openedOn, expiresOn);
  return {
    expiresOn,
    daysLeft,
    totalDays,
    progress: Math.min(1, Math.max(0, daysLeft / totalDays)),
    label: shelfLifeLabel(daysLeft),
    isExpiringSoon: daysLeft <= expiringSoonDays,
  };
}

// "Saved 12 Oct", with the year only when it was saved in an earlier year.
export function savedLabel(createdAt: string, today: LocalDate): string {
  const savedOn = toLocalDate(new Date(createdAt));
  const year = savedOn.slice(0, 4);
  return `Saved ${formatDayMonth(savedOn)}${year < today.slice(0, 4) ? ` ${year}` : ''}`;
}
