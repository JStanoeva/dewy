import { lookupBarcode } from '@/features/products/services/barcodeLookupService';

let fetchMock: jest.SpiedFunction<typeof fetch>;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function found(product: Record<string, unknown>) {
  return jsonResponse({
    code: '3337875597333',
    status: 1,
    status_verbose: 'product found',
    product,
  });
}

// Rejects like a cancelled request once the lookup's timer aborts it.
function rejectOnAbort(signal: AbortSignal | null | undefined) {
  return new Promise<never>((_resolve, reject) => {
    signal?.addEventListener('abort', () => reject(new Error('Fetch request has been canceled')));
  });
}

beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('lookupBarcode request', () => {
  it('asks for the stored code with the three fields and identifies Dewy', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ code: '8800311120822', status: 0, status_verbose: 'product not found' }, 404),
    );
    await lookupBarcode('8800311120822');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://world.openbeautyfacts.org/api/v2/product/8800311120822.json?fields=product_name,brands,categories_tags',
    );
    expect(init?.headers).toEqual({
      'User-Agent': expect.stringMatching(/^Dewy\/1\.0 \(.+@.+\)$/),
      Accept: 'application/json',
    });
    expect(init?.credentials).toBe('omit');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('sends a 12-digit code as scanned, without padding', async () => {
    fetchMock.mockResolvedValue(
      found({ product_name: 'Daily Moisturizing Body Yogurt Vanilla and Oats Lotion' }),
    );
    await lookupBarcode('381371168231');
    expect(fetchMock.mock.calls[0][0]).toContain('/product/381371168231.json');
  });
});

describe('lookupBarcode found', () => {
  it('fills name, brand and type for CeraVe Hydraterende Reinigingscrème', async () => {
    fetchMock.mockResolvedValue(
      found({
        brands: 'CeraVe',
        categories_tags: [
          'en:face',
          'en:cleansers',
          'en:cleansing-milks',
          'nl:Beauty',
          'nl:Gezichtsreiniging',
          'nl:Skincare',
        ],
        product_name: 'CeraVe Hydraterende Reinigingscrème',
      }),
    );
    await expect(lookupBarcode('3337875597333')).resolves.toEqual({
      name: 'CeraVe Hydraterende Reinigingscrème',
      brand: 'CeraVe',
      category: 'cleanser',
    });
  });

  it('keeps a sunscreen also tagged as a face cream as SPF', async () => {
    fetchMock.mockResolvedValue(
      found({
        brands: 'La Roche-Posay',
        categories_tags: [
          'en:face',
          'en:suncare',
          'en:facial-creams',
          'en:in-sun-protections',
          'en:sunscreen',
          'en:facial-sunscreens',
        ],
        product_name: 'La Roche-Posay Anthelios UVMune 400 Fluido Antimanchas SPF 50+',
      }),
    );
    await expect(lookupBarcode('3337875917407')).resolves.toMatchObject({ category: 'spf' });
  });

  it('lets the rule order win over the tag order', async () => {
    fetchMock.mockResolvedValue(
      found({
        product_name: 'Day Cream SPF 30',
        categories_tags: ['en:facial-creams', 'en:sunscreen'],
      }),
    );
    await expect(lookupBarcode('3337875917407')).resolves.toMatchObject({ category: 'spf' });
  });

  it('matches a capitalised keyword', async () => {
    fetchMock.mockResolvedValue(
      found({ product_name: 'Clay Detox Mask', categories_tags: ['en:Face Masks'] }),
    );
    await expect(lookupBarcode('3282770037159')).resolves.toMatchObject({ category: 'mask' });
  });

  it('reads the real mixed-case tags of a toner', async () => {
    fetchMock.mockResolvedValue(
      found({
        brands: 'COSRX',
        categories_tags: [
          'en:Exfoliating liquids',
          'en:Face care',
          'en:Facial toners',
          'en:Pore treatments',
        ],
        product_name: 'Two in One Poreless Power Liquid',
      }),
    );
    await expect(lookupBarcode('8809416471655')).resolves.toMatchObject({ category: 'toner' });
  });

  it('maps an essence tagged as a serum to serum', async () => {
    fetchMock.mockResolvedValue(
      found({
        brands: 'COSRX',
        categories_tags: ['en:Cosmetics', 'en:Face care', 'en:Facial essences', 'en:Facial serums'],
        product_name: 'Cosrx Hyaluronic Acid Hydra Power Essence',
      }),
    );
    await expect(lookupBarcode('8809416470184')).resolves.toMatchObject({ category: 'serum' });
  });

  it.each([
    ['a hair mask', ['en:hair', 'en:hair-care', 'en:hair-masks']],
    ['a toothpaste', ['en:toothpastes', 'en:whitening-creams']],
    ['a make-up primer', ['ro:make up', 'en:primer-serums']],
    ['an after-sun lotion', ['en:after-sun-care', 'en:sun-lotions']],
  ])('leaves the type unselected for %s', async (_label, tags) => {
    fetchMock.mockResolvedValue(
      found({
        brands: 'Le Petit Marseillais',
        categories_tags: tags,
        product_name: 'Masque 4 en 1',
      }),
    );
    await expect(lookupBarcode('3574661575209')).resolves.toEqual({
      name: 'Masque 4 en 1',
      brand: 'Le Petit Marseillais',
      category: null,
    });
  });

  it('fills only name and brand when the product has no tags', async () => {
    fetchMock.mockResolvedValue(
      found({
        brands: 'Aveeno',
        product_name: 'Daily Moisturizing Body Yogurt Vanilla and Oats Lotion',
      }),
    );
    await expect(lookupBarcode('0381371168231')).resolves.toEqual({
      name: 'Daily Moisturizing Body Yogurt Vanilla and Oats Lotion',
      brand: 'Aveeno',
      category: null,
    });
  });

  it('ignores keys it did not ask for', async () => {
    fetchMock.mockResolvedValue(
      found({
        brands: 'Garnier',
        categories_tags: [],
        ecoscore_tags: ['unknown'],
        product_name: 'Micellar Cleansing Water Sensitive Skin',
      }),
    );
    await expect(lookupBarcode('3600541358508')).resolves.toEqual({
      name: 'Micellar Cleansing Water Sensitive Skin',
      brand: 'Garnier',
      category: null,
    });
  });
});

describe('lookupBarcode cleanup', () => {
  it.each([
    ['Garnier, Ambre Solaire', 'Garnier'],
    [',Aveeno', 'Aveeno'],
    ['  Mellow   Lab , Mellow', 'Mellow Lab'],
    ['', null],
    ['a'.repeat(61), null],
  ])('takes the brand %j as %j', async (brands, brand) => {
    fetchMock.mockResolvedValue(found({ brands, product_name: 'Gentle Oat Cleanser' }));
    await expect(lookupBarcode('5901234123457')).resolves.toMatchObject({ brand });
  });

  it.each([
    ['0', null],
    ['', null],
    ['6111246203330', null],
    ['\u200B\u2060\uFEFF', null],
    ['Gentle Oat\u0000 Cleanser', 'Gentle Oat Cleanser'],
    ['n'.repeat(81), null],
    ['n'.repeat(80), 'n'.repeat(80)],
    ['Mamaearth  Vitamin C Daily Glow Sunscreen', 'Mamaearth Vitamin C Daily Glow Sunscreen'],
  ])('takes the name %j as %j', async (productName, name) => {
    fetchMock.mockResolvedValue(found({ brands: 'Mellow Lab', product_name: productName }));
    await expect(lookupBarcode('5901234123457')).resolves.toMatchObject({ name });
  });

  it('counts an emoji as one character, like the database', async () => {
    const productName = `${'n'.repeat(79)}💖`;
    fetchMock.mockResolvedValue(found({ product_name: productName }));
    await expect(lookupBarcode('5901234123457')).resolves.toMatchObject({ name: productName });
  });

  it('drops only an odd field and keeps the rest', async () => {
    fetchMock.mockResolvedValue(
      found({
        brands: ['CeraVe'],
        categories_tags: ['en:cleansers'],
        product_name: 'CeraVe Hydraterende Reinigingscrème',
      }),
    );
    await expect(lookupBarcode('3337875597333')).resolves.toEqual({
      name: 'CeraVe Hydraterende Reinigingscrème',
      brand: null,
      category: 'cleanser',
    });
  });
});

describe('lookupBarcode not found', () => {
  it("returns null for Scan test's 404", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ code: '8800311120822', status: 0, status_verbose: 'product not found' }, 404),
    );
    await expect(lookupBarcode('8800311120822')).resolves.toBeNull();
  });

  it('returns null for a food record', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          code: '5901234123457',
          status: 0,
          status_verbose: 'product found with a different product type: food',
        },
        404,
      ),
    );
    await expect(lookupBarcode('5901234123457')).resolves.toBeNull();
  });

  it('returns null for a 404 that is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Not found</html>', { status: 404 }));
    await expect(lookupBarcode('5900000000176')).resolves.toBeNull();
  });

  it('returns null for status 0 with HTTP 200', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ code: '00000000', status: 0, status_verbose: 'no code or invalid code' }),
    );
    await expect(lookupBarcode('000000')).resolves.toBeNull();
  });

  it('returns null for a found record with nothing usable', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        code: '8809348507040',
        product: {},
        status: 1,
        status_verbose: 'product found',
      }),
    );
    await expect(lookupBarcode('8809348507040')).resolves.toBeNull();
  });
});

describe('lookupBarcode failed', () => {
  it.each([429, 500, 503])('throws on HTTP %i', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 0 }, status));
    await expect(lookupBarcode('3337875597333')).rejects.toThrow();
  });

  it('throws on a body that is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Maintenance</html>', { status: 200 }));
    await expect(lookupBarcode('3337875597333')).rejects.toThrow();
  });

  it('throws on a body with a text status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: '1', product: {} }));
    await expect(lookupBarcode('3337875597333')).rejects.toThrow();
  });

  it('throws when the network is down', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(lookupBarcode('3337875597333')).rejects.toThrow();
  });

  it('gives up after 8 seconds without an answer', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation((_url, init) => rejectOnAbort(init?.signal));
    const lookup = lookupBarcode('3337875597333');
    const settled = jest.fn();
    lookup.then(settled, settled);

    await jest.advanceTimersByTimeAsync(7999);
    expect(settled).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    await expect(lookup).rejects.toThrow();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('also gives up when the body stops arriving', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(async (_url, init) => {
      const response = new Response('{}', { status: 200 });
      jest.spyOn(response, 'json').mockImplementation(() => rejectOnAbort(init?.signal));
      return response;
    });
    const lookup = lookupBarcode('3337875597333');
    const settled = jest.fn();
    lookup.then(settled, settled);

    await jest.advanceTimersByTimeAsync(7999);
    expect(settled).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    await expect(lookup).rejects.toThrow();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('clears its timer after an answer', async () => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValue(jsonResponse({ code: '8800311120822', status: 0 }, 404));
    await lookupBarcode('8800311120822');
    expect(jest.getTimerCount()).toBe(0);
  });
});
