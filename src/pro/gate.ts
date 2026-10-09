import { FREE_VEHICLE_LIMIT } from './features';

/**
 * Ücretsiz sürümde araç sınırına gelinip gelinmediği. Sınır yalnız yeni araç
 * eklerken bakılır; var olan araçlar hiçbir zaman kilitlenmez (yedekten dönen
 * kullanıcı kayıtlarını kaybetmesin).
 */
export function vehicleLimitReached(vehicleCount: number, pro: boolean): boolean {
  return !pro && vehicleCount >= FREE_VEHICLE_LIMIT;
}

/** Ücretsiz sürümde kaç araç daha eklenebilir; Pro'da sınır yok (null). */
export function vehiclesLeft(vehicleCount: number, pro: boolean): number | null {
  if (pro) return null;
  return Math.max(0, FREE_VEHICLE_LIMIT - vehicleCount);
}
