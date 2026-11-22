import { listProducts } from '@/features/products/services/productService';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));
jest.mock('@/features/products/services/productPhotoService', () => ({}));

const row = {
  id: 'p1',
  status: 'owned',
  name: 'Barrier Cream',
  brand: 'Mellow Lab',
  category: 'moisturizer',
  packaging: 'jar',
  photo_path: null,
  opened_on: '2026-11-01',
  pao_months: 12,
  actives: [],
  size_ml: 50,
  start_fraction: 1,
  tracked_from: '2026-11-01',
  notes: null,
  is_favorite: false,
  created_at: '2026-11-01T09:00:00+00:00',
  updated_at: '2026-11-01T09:00:00+00:00',
};

function answerWith(rows: object[]) {
  const secondOrder = () => Promise.resolve({ data: rows, error: null });
  mockFrom.mockReturnValue({ select: () => ({ order: () => ({ order: secondOrder }) }) });
}

describe('listProducts', () => {
  it('returns rows whose dates are real calendar days', async () => {
    answerWith([row, { ...row, id: 'p2', opened_on: null }]);
    const products = await listProducts();
    expect(products.map((product) => [product.id, product.openedOn, product.trackedFrom])).toEqual([
      ['p1', '2026-11-01', '2026-11-01'],
      ['p2', null, '2026-11-01'],
    ]);
  });

  it('rejects a malformed opened date, so the Shelf shows its error state', async () => {
    answerWith([row, { ...row, id: 'p2', opened_on: '2026-02-30' }]);
    await expect(listProducts()).rejects.toThrow();
  });

  it('rejects a malformed tracking date', async () => {
    answerWith([{ ...row, tracked_from: '22 Nov 2026' }]);
    await expect(listProducts()).rejects.toThrow();
  });
});
