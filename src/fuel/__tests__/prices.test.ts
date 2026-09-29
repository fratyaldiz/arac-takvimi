import { isStale, parseFuelPrices, priceAgeDays, STALE_AFTER_DAYS } from '../prices';

const now = new Date('2026-09-14T12:00:00Z');

describe('yakıt fiyatı ayrıştırma', () => {
  it('servisin gerçek yanıt biçimini okur', () => {
    const json = {
      prices: [
        { fuelType: 'Motorin', price: 87.22, date: '2026-09-12T00:00:00.000Z' },
        { fuelType: 'Benzin', price: 78.23, date: '2026-09-12T00:00:00.000Z' },
        { fuelType: 'LPG', price: 34.81, date: '2026-09-03T00:00:00.000Z' },
      ],
    };
    const parsed = parseFuelPrices(json, now)!;
    expect(parsed.prices).toEqual({ benzin: 78.23, motorin: 87.22, lpg: 34.81 });
    expect(parsed.priceDates.lpg).toBe('2026-09-03');
  });

  it('bozuk kayıtları atlar', () => {
    const parsed = parseFuelPrices({ prices: [{ fuelType: 'Benzin', price: 'x' }, { fuelType: 'Motorin', price: 80 }] }, now)!;
    expect(parsed.prices.benzin).toBeNull();
    expect(parsed.prices.motorin).toBe(80);
  });

  it('beklenmeyen yanıtta null döner', () => {
    expect(parseFuelPrices({ data: [] }, now)).toBeNull();
    expect(parseFuelPrices(null, now)).toBeNull();
    expect(parseFuelPrices({ prices: [] }, now)).toBeNull();
  });

  it('6 saatten eski veri bayat sayılır', () => {
    const fresh = parseFuelPrices({ prices: [{ fuelType: 'Benzin', price: 78 }] }, now)!;
    expect(isStale(fresh, new Date('2026-09-14T17:00:00Z'))).toBe(false);
    expect(isStale(fresh, new Date('2026-09-14T18:30:00Z'))).toBe(true);
    expect(isStale(null, now)).toBe(true);
  });
});

describe('fiyat yaşı', () => {
  const data = parseFuelPrices(
    {
      prices: [
        { fuelType: 'Benzin', price: 78.82, date: '2026-09-25T00:00:00.000Z' },
        { fuelType: 'LPG', price: 34.81, date: '2026-09-03T00:00:00.000Z' },
      ],
    },
    now,
  );

  it('kaynağın fiyat tarihinden gün farkını verir', () => {
    expect(priceAgeDays(data, 'benzin', '2026-09-30')).toBe(5);
    expect(priceAgeDays(data, 'lpg', '2026-09-30')).toBe(27);
  });

  it('tarihi olmayan yakıt için null', () => {
    expect(priceAgeDays(data, 'motorin', '2026-09-30')).toBeNull();
    expect(priceAgeDays(null, 'benzin', '2026-09-30')).toBeNull();
  });

  it('eskime sınırı bir haftadır', () => {
    expect(STALE_AFTER_DAYS).toBe(7);
  });
});
