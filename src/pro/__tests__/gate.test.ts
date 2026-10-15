import { FREE_VEHICLE_LIMIT } from '../features';
import { PRO_VISIBLE, vehicleLimitReached, vehiclesLeft } from '../gate';

describe('araç sınırı', () => {
  it('ücretsiz sürümde sınıra gelince yeni araç engellenir', () => {
    expect(vehicleLimitReached(0, false, true)).toBe(false);
    expect(vehicleLimitReached(FREE_VEHICLE_LIMIT, false, true)).toBe(true);
  });

  it('Pro her zaman ekleyebilir', () => {
    expect(vehicleLimitReached(0, true, true)).toBe(false);
    expect(vehicleLimitReached(25, true, true)).toBe(false);
  });

  it('yedekten dönen fazla araç kilitlenmez, sadece yeni ekleme kapanır', () => {
    expect(vehiclesLeft(5, false, true)).toBe(0);
    expect(vehicleLimitReached(5, false, true)).toBe(true);
  });

  it('kalan hak Pro’da sınırsızdır', () => {
    expect(vehiclesLeft(0, false, true)).toBe(FREE_VEHICLE_LIMIT);
    expect(vehiclesLeft(3, true, true)).toBeNull();
  });
});

describe('Pro satışa kapalıyken', () => {
  it('araç sınırı hiç uygulanmaz', () => {
    expect(vehicleLimitReached(99, false, false)).toBe(false);
    expect(vehiclesLeft(99, false, false)).toBeNull();
  });

  it('varsayılan satın alma durumunu kullanır', () => {
    // PRO_VISIBLE şu an false; satın alma açılınca bu test kuralı korur.
    expect(vehicleLimitReached(99, false)).toBe(PRO_VISIBLE);
  });
});
