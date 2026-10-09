import type { Expense, ExpenseCategory, Vehicle } from '../types';
import type { ISODate } from '../utils/date';
import { categoryTotals } from './stats';

export interface VehicleReport {
  vehicleId: string;
  total: number;
  count: number;
  /**
   * Dönem içindeki en düşük ve en yüksek km okuması arasındaki fark.
   * Km girilmemişse null; kullanıcı her masrafta km yazmadığı için bu değer
   * gerçek yol mesafesinin altında kalabilir.
   */
  kmDriven: number | null;
  costPerKm: number | null;
  categories: { category: ExpenseCategory; total: number }[];
}

export interface Report {
  from: ISODate;
  to: ISODate;
  total: number;
  count: number;
  categories: { category: ExpenseCategory; total: number }[];
  byVehicle: VehicleReport[];
  /** Dönemdeki en pahalı tek masraf. */
  largest: Expense | null;
}

function kmRange(expenses: Expense[]): number | null {
  const readings = expenses.map((e) => e.odometerKm).filter((km): km is number => km !== null);
  if (readings.length < 2) return null;
  const distance = Math.max(...readings) - Math.min(...readings);
  return distance > 0 ? distance : null;
}

/** Verilen tarih aralığındaki masrafların araç ve kategori kırılımı. */
export function buildReport(expenses: Expense[], vehicles: Vehicle[], from: ISODate, to: ISODate): Report {
  const period = expenses.filter((e) => e.date >= from && e.date <= to);
  const byVehicle = vehicles
    .map((vehicle) => {
      const own = period.filter((e) => e.vehicleId === vehicle.id);
      const total = own.reduce((sum, e) => sum + e.amount, 0);
      const kmDriven = kmRange(own);
      return {
        vehicleId: vehicle.id,
        total,
        count: own.length,
        kmDriven,
        costPerKm: kmDriven ? total / kmDriven : null,
        categories: categoryTotals(own),
      };
    })
    .filter((report) => report.count > 0)
    .sort((a, b) => b.total - a.total);

  return {
    from,
    to,
    total: period.reduce((sum, e) => sum + e.amount, 0),
    count: period.length,
    categories: categoryTotals(period),
    byVehicle,
    largest: period.reduce<Expense | null>((max, e) => (!max || e.amount > max.amount ? e : max), null),
  };
}

export interface Period {
  key: string;
  label: string;
  from: ISODate;
  to: ISODate;
}

/** Rapor ekranındaki dönem seçenekleri: bu yıl, geçen yıl, tümü. */
export function reportPeriods(today: ISODate, firstRecord: ISODate | null): Period[] {
  const year = Number(today.slice(0, 4));
  return [
    { key: 'year', label: `${year}`, from: `${year}-01-01`, to: today },
    { key: 'prev', label: `${year - 1}`, from: `${year - 1}-01-01`, to: `${year - 1}-12-31` },
    { key: 'all', label: 'Tümü', from: firstRecord ?? `${year}-01-01`, to: today },
  ];
}
