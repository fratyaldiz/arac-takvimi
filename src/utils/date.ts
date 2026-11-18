/**
 * Takvim tarihleri 'YYYY-MM-DD' olarak saklanır. Saat dilimi kayması
 * yaşanmasın diye tüm hesaplar yerel tarih üzerinden yapılır.
 */
export type ISODate = string;

export const MONTHS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const WEEKDAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Tarih metinleri uygulamanın dilini izler. Dil değişince App bu değeri
 * günceller; varsayılan Türkçedir, testler de Türkçe üzerinden yazılmıştır.
 */
let locale: 'tr' | 'en' = 'tr';

export function setDateLocale(next: 'tr' | 'en'): void {
  locale = next;
}

function months(): string[] {
  return locale === 'en' ? MONTHS_EN : MONTHS_TR;
}

function weekdays(): string[] {
  return locale === 'en' ? WEEKDAYS_EN : WEEKDAYS_TR;
}

function split(iso: ISODate): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m, d];
}

export function toISO(date: Date): ISODate {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function parseISO(iso: ISODate): Date {
  const [y, m, d] = split(iso);
  return new Date(y, m - 1, d);
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISO(now);
}

/** month 1-12 */
export function makeISO(year: number, month: number, day: number): ISODate {
  return toISO(new Date(year, month - 1, day));
}

/** month 1-12 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Ay sonunu taşırmaz: 31 Ocak + 1 ay = 28/29 Şubat. */
export function addMonths(iso: ISODate, months: number): ISODate {
  const [y, m, d] = split(iso);
  const total = y * 12 + (m - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return makeISO(year, month, Math.min(d, daysInMonth(year, month)));
}

export function addYears(iso: ISODate, years: number): ISODate {
  return addMonths(iso, years * 12);
}

export function addDays(iso: ISODate, days: number): ISODate {
  const date = parseISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

export function daysBetween(from: ISODate, to: ISODate): number {
  const [y1, m1, d1] = split(from);
  const [y2, m2, d2] = split(to);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

export function maxISO(a: ISODate, b: ISODate): ISODate {
  return a > b ? a : b;
}

export function formatTR(iso: ISODate): string {
  const [y, m, d] = split(iso);
  return locale === 'en' ? `${months()[m - 1]} ${d}, ${y}` : `${d} ${months()[m - 1]} ${y}`;
}

/** "26 Eyl" */
export function formatShortTR(iso: ISODate): string {
  const [, m, d] = split(iso);
  const month = months()[m - 1].slice(0, 3);
  return locale === 'en' ? `${month} ${d}` : `${d} ${month}`;
}

export function weekdayTR(iso: ISODate): string {
  return weekdays()[parseISO(iso).getDay()];
}

/** "Eylül 2026" */
export function formatMonthTR(yearMonth: string): string {
  return `${months()[Number(yearMonth.slice(5, 7)) - 1]} ${yearMonth.slice(0, 4)}`;
}

/** Ay adıyla gün: "15 Kasım" */
export function formatDayMonthTR(month: number, day: number): string {
  return locale === 'en' ? `${months()[month - 1]} ${day}` : `${day} ${months()[month - 1]}`;
}

export function relativeTR(days: number): string {
  if (locale === 'en') {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days > 0) return `${days} days`;
    if (days === -1) return 'Due yesterday';
    return `${-days} days ago`;
  }
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Yarın';
  if (days > 0) return `${days} gün`;
  if (days === -1) return 'Dün doldu';
  return `${-days} gün geçti`;
}
