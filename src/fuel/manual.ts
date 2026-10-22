import type { FuelType } from '../types';
import type { FuelPrices } from './prices';

/** Kullanıcının kendi girdiği pompa fiyatları (TL/litre). */
export type ManualPrices = Partial<Record<FuelType, number>>;

/** Makul pompa fiyatı aralığı; yanlış basılan rakam kaydedilmesin. */
export const MIN_MANUAL_PRICE = 1;
export const MAX_MANUAL_PRICE = 999;

export function isValidManualPrice(value: number): boolean {
  return Number.isFinite(value) && value >= MIN_MANUAL_PRICE && value <= MAX_MANUAL_PRICE;
}

/**
 * Hesaplarda kullanılacak fiyat: kullanıcı kendi fiyatını girdiyse o, yoksa
 * kaynağın ülke ortalaması. Kaynak modellenmiş tahmin verdiği ve pompadan
 * birkaç lira sapabildiği için kullanıcının girdiği değer her zaman önceliklidir.
 */
export function effectivePrice(manual: ManualPrices, data: FuelPrices | null, type: FuelType): number | null {
  const own = manual[type];
  if (own !== undefined && isValidManualPrice(own)) return own;
  return data?.prices[type] ?? null;
}

export function isManual(manual: ManualPrices, type: FuelType): boolean {
  const own = manual[type];
  return own !== undefined && isValidManualPrice(own);
}
