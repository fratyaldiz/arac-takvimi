import { daysBetween, type ISODate } from '../utils/date';

/**
 * Lastik DOT kodu: yan duvarda "DOT ... 2320" biçiminde biter; son dört hane
 * üretim haftası (ilk iki) ve yılı (son iki) verir. 2320 = 2020'nin 23. haftası.
 */
export interface TireAge {
  week: number;
  year: number;
  /** Üretim haftasının ilk günü (yaklaşık). */
  producedOn: ISODate;
  ageYears: number;
}

/** Lastik üreticilerinin genel önerisi: üretimden 6 yıl sonra değişim. */
export const TIRE_REPLACE_AGE_YEARS = 6;
/** 10 yılı geçen lastik, diş derinliği yeterli olsa da kullanılmamalı. */
export const TIRE_MAX_AGE_YEARS = 10;

const DOT_PATTERN = /^(\d{2})(\d{2})$/;

/** Haftanın ilk gününe yakın bir tarih; gün farkı hesabı için yeterli. */
function weekStart(year: number, week: number): ISODate {
  const firstDay = new Date(Date.UTC(year, 0, 1));
  const days = (week - 1) * 7;
  const date = new Date(firstDay.getTime() + days * 86_400_000);
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${m}-${d}`;
}

/**
 * DOT'un son dört hanesini okur. Geçersiz hafta (0 ya da 53'ten büyük) ve
 * gelecekteki üretim tarihi reddedilir.
 */
export function parseDotCode(code: string, today: ISODate): TireAge | null {
  const match = DOT_PATTERN.exec(code.replace(/\s/g, ''));
  if (!match) return null;
  const week = Number(match[1]);
  const shortYear = Number(match[2]);
  if (week < 1 || week > 53) return null;

  const currentYear = Number(today.slice(0, 4));
  const century = Math.floor(currentYear / 100) * 100;
  // 2 haneli yıl: içinde bulunduğumuz yüzyıl, ileri tarih çıkıyorsa bir önceki.
  let year = century + shortYear;
  if (year > currentYear) year -= 100;

  const producedOn = weekStart(year, week);
  if (producedOn > today) return null;
  return { week, year, producedOn, ageYears: daysBetween(producedOn, today) / 365.25 };
}

export type TireAdvice = 'ok' | 'aging' | 'replace';

/** Yaşa göre uyarı seviyesi. */
export function tireAdvice(age: TireAge): TireAdvice {
  if (age.ageYears >= TIRE_MAX_AGE_YEARS) return 'replace';
  if (age.ageYears >= TIRE_REPLACE_AGE_YEARS) return 'aging';
  return 'ok';
}
