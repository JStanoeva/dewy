import type { BottleShape } from '@/components/BottleIllustration';
import type { Active, Category, Fullness, productStatuses } from '@/features/products/constants';
import type { LocalDate } from '@/utils/localDate';

export type ProductStatus = (typeof productStatuses)[number];

// The form's photo: the one already saved, or a new local JPEG that uploads on Save.
export type ProductPhotoValue = { kind: 'stored'; path: string } | { kind: 'new'; uri: string };

export type Product = {
  id: string;
  status: ProductStatus;
  name: string;
  brand: string | null;
  category: Category;
  // The bottle drawn when there's no photo.
  packaging: BottleShape;
  photoPath: string | null;
  openedOn: string | null;
  paoMonths: number | null;
  actives: Active[];
  sizeMl: number | null;
  // How full the bottle was on trackedFrom, the ritual day the uses-left count starts from.
  startFraction: Fullness;
  trackedFrom: LocalDate;
  notes: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};
