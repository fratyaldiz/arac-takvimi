import type { FuelType } from '../types';

/**
 * UcuzYakıtBul ücretsiz ülke ortalaması: anahtar gerektirmez, ticari kullanım
 * serbest. İl bazlı veri ücretli uçlarda.
 */
export const FUEL_PRICE_URL = 'https://ucuzyakitbul.com.tr/api/prices/national';
export const FUEL_PRICE_SOURCE = 'UcuzYakıtBul · ülke ortalaması';

/** Fiyatlar günde birkaç kez değişebilir; 6 saatten eski veri tazelenir. */
export const FUEL_PRICE_TTL_MS = 6 * 60 * 60 * 1000;

export interface FuelPrices {
  prices: Record<FuelType, number | null>;
  /** Kaynağın fiyat tarihi (YYYY-MM-DD) */
  priceDates: Partial<Record<FuelType, string>>;
  fetchedAt: string;
}

const TYPES: Record<string, FuelType> = { benzin: 'benzin', motorin: 'motorin', lpg: 'lpg' };

export function parseFuelPrices(json: unknown, fetchedAt: Date): FuelPrices | null {
  const list = (json as { prices?: unknown } | null)?.prices;
  if (!Array.isArray(list)) return null;
  const result: FuelPrices = {
    prices: { benzin: null, motorin: null, lpg: null },
    priceDates: {},
    fetchedAt: fetchedAt.toISOString(),
  };
  for (const item of list as { fuelType?: unknown; price?: unknown; date?: unknown }[]) {
    const type = TYPES[String(item?.fuelType ?? '').toLowerCase()];
    const price = Number(item?.price);
    if (!type || !Number.isFinite(price) || price <= 0) continue;
    result.prices[type] = price;
    if (typeof item.date === 'string') result.priceDates[type] = item.date.slice(0, 10);
  }
  return Object.values(result.prices).some((p) => p !== null) ? result : null;
}

export async function fetchFuelPrices(): Promise<FuelPrices> {
  const response = await fetch(FUEL_PRICE_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const parsed = parseFuelPrices(await response.json(), new Date());
  if (!parsed) throw new Error('Beklenmeyen yanıt');
  return parsed;
}

export function isStale(data: FuelPrices | null, now: Date): boolean {
  return !data || now.getTime() - Date.parse(data.fetchedAt) > FUEL_PRICE_TTL_MS;
}
