import type { Expense, ExpenseCategory, Vehicle } from '../types';
import type { ISODate } from '../utils/date';
import { fuelConsumption } from './stats';

/** Servis defterine giren masraf türleri; yakıt ve otopark buraya girmez. */
export const SERVICE_CATEGORIES: ExpenseCategory[] = ['bakim', 'parca', 'lastik'];

export interface ServiceEntry {
  id: string;
  date: ISODate;
  category: ExpenseCategory;
  label: string;
  amount: number;
  odometerKm: number | null;
}

/**
 * Aracın yapılan işler defteri: bakım, parça ve lastik masrafları yeniden
 * eskiye. Ayrı bir kayıt tutulmaz; kullanıcının girdiği masraflardan türetilir,
 * böylece eski kayıtlar da defterde görünür.
 */
export function serviceLog(expenses: Expense[], vehicleId: string): ServiceEntry[] {
  return expenses
    .filter((e) => e.vehicleId === vehicleId && SERVICE_CATEGORIES.includes(e.category))
    .map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      label: e.note.trim(),
      amount: e.amount,
      odometerKm: e.odometerKm,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export interface VehicleComparison {
  vehicleId: string;
  total: number;
  /** Kilometre okuması olan masraflardan çıkan menzil. */
  kmDriven: number | null;
  costPerKm: number | null;
  litersPer100Km: number | null;
}

function kmRange(expenses: Expense[]): number | null {
  const readings = expenses.map((e) => e.odometerKm).filter((km): km is number => km !== null);
  if (readings.length < 2) return null;
  const distance = Math.max(...readings) - Math.min(...readings);
  return distance > 0 ? distance : null;
}

/**
 * Araçları yan yana koyar: dönemdeki toplam masraf, km başına maliyet ve
 * tüketim. Yalnız kaydı olan araçlar döner, pahalıdan ucuza sıralanır.
 */
export function compareVehicles(
  expenses: Expense[],
  vehicles: Vehicle[],
  from: ISODate,
  to: ISODate,
): VehicleComparison[] {
  return vehicles
    .map((vehicle) => {
      const own = expenses.filter((e) => e.vehicleId === vehicle.id && e.date >= from && e.date <= to);
      const total = own.reduce((sum, e) => sum + e.amount, 0);
      const kmDriven = kmRange(own);
      const consumption = fuelConsumption(own);
      return {
        vehicleId: vehicle.id,
        total,
        kmDriven,
        costPerKm: kmDriven ? total / kmDriven : null,
        litersPer100Km: consumption ? consumption.litersPer100Km : null,
      };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
}
