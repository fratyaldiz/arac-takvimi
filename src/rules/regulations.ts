/**
 * Türkiye'ye özgü araç yükümlülükleri. Mevzuat değişirse yalnızca bu dosya
 * güncellenir; hesap motoru (schedule.ts) değerleri buradan okur.
 *
 * Son doğrulama: 14 Eylül 2026.
 */
import type { VehicleKind } from '../types';

/**
 * Karayolları Trafik Yönetmeliği muayene süreleri (yıl).
 * - Hususi otomobil: ilk muayene 3. yıl, sonra 2 yılda bir.
 * - İki/üç tekerlekli (motosiklet): ilk 3. yıl, sonra 2 yılda bir.
 * - Ticari (taksi, minibüs, kamyonet, kamyon, otobüs): ilk 1. yıl, sonra her yıl.
 */
export const INSPECTION_PERIOD_YEARS: Record<VehicleKind, { first: number; then: number }> = {
  hususi: { first: 3, then: 2 },
  motosiklet: { first: 3, then: 2 },
  ticari: { first: 1, then: 1 },
};

/** Geciken her ay için muayene ücretine eklenen zam (%). */
export const INSPECTION_LATE_FEE_PERCENT_PER_MONTH = 5;

/** MTV iki taksit: Ocak ve Temmuz, son gün ayın son günü. */
export const MTV_INSTALLMENTS = [
  { index: 1, month: 1 },
  { index: 2, month: 7 },
] as const;

/**
 * Kış lastiği: 2025-26 sezonundan itibaren 15 Kasım – 15 Nisan.
 * Zorunluluk şehirlerarası yolcu/eşya taşıyan ticari araçlar için;
 * hususi araçlarda yalnızca öneri.
 */
export const WINTER_TIRE = {
  start: { month: 11, day: 15 },
  end: { month: 4, day: 15 },
} as const;

export const INSURANCE_TERM_YEARS = 1;

export const DEFAULT_SERVICE_INTERVAL_MONTHS = 12;
export const SERVICE_INTERVAL_OPTIONS = [6, 12, 18, 24];

/**
 * Trafik cezası (2918 KTK m.115, 31.01.2024 değişikliği): tebliğden itibaren
 * 1 ay içinde ödenirse %25 indirim. Süresinde ödenmezse aylık %5 faiz işler,
 * faiz cezanın iki katını geçemez.
 */
export const FINE_DISCOUNT_PERCENT = 25;
export const FINE_DISCOUNT_MONTHS = 1;
export const FINE_LATE_PERCENT_PER_MONTH = 5;

/** Bu kadar gün kalınca iş "yaklaşıyor" sayılır. */
export const SOON_THRESHOLD_DAYS = 30;
/** Km'ye bağlı işlerde bu kadar km kalınca iş "yaklaşıyor" sayılır. */
export const SOON_THRESHOLD_KM = 1000;

/** Bildirimler son tarihten kaç gün önce gönderilir. */
export const REMINDER_OFFSETS_DAYS = [30, 7, 1, 0];
export const REMINDER_HOUR = 10;
