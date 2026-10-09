import { FREE_VEHICLE_LIMIT } from '../features';
import { vehicleLimitReached, vehiclesLeft } from '../gate';

describe('araç sınırı', () => {
  it('ücretsiz sürümde sınıra gelince yeni araç engellenir', () => {
    expect(vehicleLimitReached(0, false)).toBe(false);
    expect(vehicleLimitReached(FREE_VEHICLE_LIMIT, false)).toBe(true);
  });

  it('Pro her zaman ekleyebilir', () => {
    expect(vehicleLimitReached(0, true)).toBe(false);
    expect(vehicleLimitReached(25, true)).toBe(false);
  });

  it('yedekten dönen fazla araç kilitlenmez, sadece yeni ekleme kapanır', () => {
    expect(vehiclesLeft(5, false)).toBe(0);
    expect(vehicleLimitReached(5, false)).toBe(true);
  });

  it('kalan hak Pro’da sınırsızdır', () => {
    expect(vehiclesLeft(0, false)).toBe(FREE_VEHICLE_LIMIT);
    expect(vehiclesLeft(3, true)).toBeNull();
  });
});
