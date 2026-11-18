import { categoryDetails, type Category, type Fullness } from '@/features/products/constants';

// Uses in the bottle when the count starts: size × fullness ÷ the type's typical dose, rounded.
export function getStartingUses(sizeMl: number, startFraction: Fullness, category: Category) {
  return Math.round((sizeMl * startFraction) / categoryDetails[category].doseMl);
}

// A save restarts the count from today only with a size and a picked fullness.
export function restartsCount({
  sizeMl,
  startFraction,
}: {
  sizeMl: number | null;
  startFraction: Fullness | null;
}) {
  return sizeMl !== null && startFraction !== null;
}
