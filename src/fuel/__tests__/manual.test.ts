import { effectivePrice, isManual, isValidManualPrice, MAX_MANUAL_PRICE } from '../manual';
import { parseFuelPrices } from '../prices';

const data = parseFuelPrices(
  {
    prices: [
      { fuelType: 'Benzin', price: 75.69, date: '2026-10-22T00:00:00.000Z' },
      { fuelType: 'LPG', price: 41.13, date: '2026-10-03T00:00:00.000Z' },
    ],
  },
  new Date('2026-10-23T09:00:00Z'),
);

describe('kendi pompa fiyatı', () => {
  it('kullanıcının fiyatı kaynağın tahminini ezer', () => {
    expect(effectivePrice({ benzin: 83.8 }, data, 'benzin')).toBe(83.8);
    expect(isManual({ benzin: 83.8 }, 'benzin')).toBe(true);
  });

  it('girilmemiş yakıtta kaynağın değeri kullanılır', () => {
    expect(effectivePrice({ benzin: 83.8 }, data, 'lpg')).toBe(41.13);
    expect(isManual({ benzin: 83.8 }, 'lpg')).toBe(false);
  });

  it('kaynak da yoksa null döner', () => {
    expect(effectivePrice({}, data, 'motorin')).toBeNull();
    expect(effectivePrice({}, null, 'benzin')).toBeNull();
  });

  it('saçma değerler kabul edilmez', () => {
    expect(isValidManualPrice(0)).toBe(false);
    expect(isValidManualPrice(-5)).toBe(false);
    expect(isValidManualPrice(MAX_MANUAL_PRICE + 1)).toBe(false);
    expect(isValidManualPrice(Number.NaN)).toBe(false);
    expect(isValidManualPrice(83.8)).toBe(true);
  });

  it('geçersiz kayıt varsa kaynağa düşülür', () => {
    expect(effectivePrice({ benzin: 0 }, data, 'benzin')).toBe(75.69);
    expect(isManual({ benzin: 0 }, 'benzin')).toBe(false);
  });
});
