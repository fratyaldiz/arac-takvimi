import type { Expense, ExpenseCategory } from '../types';
import { addMonths, MONTHS_TR, type ISODate } from '../utils/date';

export interface Consumption {
  litersPer100Km: number;
  km: number;
  liters: number;
  cost: number;
  costPerKm: number;
}

/**
 * Depo doldurma yöntemi: iki "depo full" alımı arasındaki tüm litreler, iki
 * alım arasındaki km farkına bölünür. Kısmi alımlar bir sonraki full alıma
 * eklenir; km'si girilmemiş alımlar hesaba katılmaz.
 */
export function fuelConsumption(expenses: Expense[]): Consumption | null {
  const fills = expenses
    .filter((e) => e.fuel && e.odometerKm !== null)
    .sort((a, b) => a.odometerKm! - b.odometerKm! || (a.date < b.date ? -1 : 1));

  let km = 0;
  let liters = 0;
  let cost = 0;
  let lastFull = -1;
  for (let i = 0; i < fills.length; i++) {
    if (!fills[i].fuel!.fullTank) continue;
    if (lastFull >= 0) {
      const distance = fills[i].odometerKm! - fills[lastFull].odometerKm!;
      if (distance > 0) {
        const segment = fills.slice(lastFull + 1, i + 1);
        km += distance;
        liters += segment.reduce((sum, e) => sum + e.fuel!.liters, 0);
        cost += segment.reduce((sum, e) => sum + e.amount, 0);
      }
    }
    lastFull = i;
  }
  if (km <= 0 || liters <= 0) return null;
  return { litersPer100Km: (liters / km) * 100, km, liters, cost, costPerKm: cost / km };
}

export interface MonthTotal {
  /** YYYY-MM */
  month: string;
  label: string;
  total: number;
}

/** Bu ay dahil son `count` ayın toplamları, eskiden yeniye. */
export function monthlyTotals(expenses: Expense[], today: ISODate, count = 6): MonthTotal[] {
  const firstOfMonth = `${today.slice(0, 7)}-01`;
  const months: MonthTotal[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const month = addMonths(firstOfMonth, -i).slice(0, 7);
    months.push({ month, label: MONTHS_TR[Number(month.slice(5, 7)) - 1].slice(0, 3), total: 0 });
  }
  for (const expense of expenses) {
    const bucket = months.find((m) => m.month === expense.date.slice(0, 7));
    if (bucket) bucket.total += expense.amount;
  }
  return months;
}

export function categoryTotals(expenses: Expense[]): { category: ExpenseCategory; total: number }[] {
  const totals = new Map<ExpenseCategory, number>();
  for (const e of expenses) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  return [...totals.entries()].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);
}

export function sumBetween(expenses: Expense[], from: ISODate, to: ISODate): number {
  return expenses.filter((e) => e.date >= from && e.date <= to).reduce((sum, e) => sum + e.amount, 0);
}

export interface TripInput {
  distanceKm: number;
  litersPer100Km: number;
  pricePerLiter: number;
  tolls: number;
  people: number;
  roundTrip: boolean;
}

export interface TripResult {
  km: number;
  liters: number;
  fuelCost: number;
  total: number;
  perPerson: number;
}

export function tripCost(input: TripInput): TripResult {
  const km = input.distanceKm * (input.roundTrip ? 2 : 1);
  const liters = (km * input.litersPer100Km) / 100;
  const fuelCost = liters * input.pricePerLiter;
  const total = fuelCost + input.tolls * (input.roundTrip ? 2 : 1);
  return { km, liters, fuelCost, total, perPerson: total / Math.max(1, Math.floor(input.people)) };
}
