import type { Category } from '@/features/products/constants';
import type { Period } from '@/theme/period';

export type RoutineStep = {
  id: string;
  productId: string;
  period: Period;
  position: number;
  // ISO weekdays, Monday = 1 … Sunday = 7.
  weekdays: number[];
  durationSeconds: number;
  waitMinutes: number | null;
  note: string | null;
  createdAt: string;
  product: {
    name: string;
    brand: string | null;
    category: Category;
    photoPath: string | null;
  };
};
