import type { Category, productStatuses } from '@/features/products/constants';

export type ProductStatus = (typeof productStatuses)[number];

export type Product = {
  id: string;
  status: ProductStatus;
  name: string;
  brand: string | null;
  category: Category;
  barcode: string | null;
  photoPath: string | null;
  openedOn: string | null;
  paoMonths: number | null;
  ingredients: string[];
  notes: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};
