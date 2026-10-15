import { FREE_VEHICLE_LIMIT } from './features';
import { PURCHASES_ENABLED } from './iap';

/**
 * Pro satılabilir durumda mı. Satın alma kapalıyken Pro'nun hiçbir izi
 * görünmez: paywall açılmaz, araç sınırı uygulanmaz, Pro'ya özel satırlar
 * gizlenir. Aksi halde kullanıcı kilidi parayla bile açamayacağı bir duvara
 * çarpar ve 1.0'da sınırsız olan araç ekleme geri gider.
 */
export const PRO_VISIBLE = PURCHASES_ENABLED;

/**
 * Ücretsiz sürümde araç sınırına gelinip gelinmediği. Sınır yalnız yeni araç
 * eklerken bakılır; var olan araçlar hiçbir zaman kilitlenmez (yedekten dönen
 * kullanıcı kayıtlarını kaybetmesin).
 */
export function vehicleLimitReached(vehicleCount: number, pro: boolean, proVisible: boolean = PRO_VISIBLE): boolean {
  if (!proVisible) return false;
  return !pro && vehicleCount >= FREE_VEHICLE_LIMIT;
}

/** Ücretsiz sürümde kaç araç daha eklenebilir; Pro'da ya da Pro kapalıyken sınır yok (null). */
export function vehiclesLeft(vehicleCount: number, pro: boolean, proVisible: boolean = PRO_VISIBLE): number | null {
  if (pro || !proVisible) return null;
  return Math.max(0, FREE_VEHICLE_LIMIT - vehicleCount);
}
