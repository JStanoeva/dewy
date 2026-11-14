import type { Category, productStatuses } from '@/features/products/constants';

export type ProductStatus = (typeof productStatuses)[number];

// The form's photo: the one already saved, or a new local JPEG that uploads on Save.
export type ProductPhotoValue = { kind: 'stored'; path: string } | { kind: 'new'; uri: string };

export type Product = {
  id: string;
  status: ProductStatus;
  name: string;
  brand: string | null;
  category: Category;
  photoPath: string | null;
  openedOn: string | null;
  paoMonths: number | null;
  ingredients: string[];
  notes: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};
