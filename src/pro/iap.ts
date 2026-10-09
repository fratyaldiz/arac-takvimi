import { PRO_PRICE_FALLBACK } from './features';

export type PurchaseFailure = 'cancelled' | 'unavailable' | 'error';

export interface PurchaseResult {
  ok: boolean;
  reason?: PurchaseFailure;
  message?: string;
}

/**
 * Mağaza bağlantısı hazır mı. `expo-iap` eklenip mağazalarda ürün tanımlanana
 * kadar false; paywall bu bayrağa bakıp satın alma düğmesini kapalı gösterir.
 * Ürün kimliği: PRO_PRODUCT_ID.
 */
export const PURCHASES_ENABLED = false;

const NOT_READY: PurchaseResult = {
  ok: false,
  reason: 'unavailable',
  message: 'Satın alma henüz açılmadı. Çok yakında bu ekrandan Pro’ya geçebileceksin.',
};

/** Mağazadaki yerelleştirilmiş fiyat; okunamazsa sabit yazı kullanılır. */
export async function loadPrice(): Promise<string> {
  return PRO_PRICE_FALLBACK;
}

export async function purchasePro(): Promise<PurchaseResult> {
  return NOT_READY;
}

/** Cihaz değişiminde ya da yeniden kurulumda hakkı geri getirir. */
export async function restorePro(): Promise<PurchaseResult> {
  return NOT_READY;
}
