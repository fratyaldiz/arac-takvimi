import { EXPENSE_META, FUEL_LABEL } from '../theme';
import type { Expense, Vehicle } from '../types';
import { formatNumberTR } from '../utils/money';

/**
 * Türkçe Excel ayırıcı olarak noktalı virgül, ondalık olarak virgül bekler.
 * Dosya BOM ile başlar; yoksa Excel Türkçe karakterleri bozuk gösteriyor.
 */
export const CSV_SEPARATOR = ';';
export const CSV_BOM = '﻿';

const HEADERS = [
  'Tarih',
  'Araç',
  'Plaka',
  'Kategori',
  'Tutar (TL)',
  'Kilometre',
  'Litre',
  'Birim fiyat (TL)',
  'Yakıt türü',
  'Depo full',
  'Not',
];

function cell(value: string): string {
  const text = value ?? '';
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function decimal(value: number | null, decimals = 2): string {
  return value === null ? '' : formatNumberTR(value, decimals).replace(/\./g, '');
}

/** Masraf kayıtlarını Excel'de açılabilen CSV metnine çevirir (eskiden yeniye). */
export function expensesToCsv(expenses: Expense[], vehicles: Vehicle[]): string {
  const byId = new Map(vehicles.map((v) => [v.id, v]));
  const rows = [...expenses].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const lines = [HEADERS.join(CSV_SEPARATOR)];
  for (const expense of rows) {
    const vehicle = byId.get(expense.vehicleId);
    lines.push(
      [
        expense.date,
        cell(vehicle?.name ?? ''),
        cell(vehicle?.plate ?? ''),
        cell(EXPENSE_META[expense.category].label),
        decimal(expense.amount),
        expense.odometerKm === null ? '' : decimal(expense.odometerKm, 0),
        decimal(expense.fuel?.liters ?? null),
        decimal(expense.fuel?.pricePerLiter ?? null),
        expense.fuel ? FUEL_LABEL[expense.fuel.fuelType] : '',
        expense.fuel ? (expense.fuel.fullTank ? 'Evet' : 'Hayır') : '',
        cell(expense.note),
      ].join(CSV_SEPARATOR),
    );
  }
  return CSV_BOM + lines.join('\r\n') + '\r\n';
}

export function csvFileName(now: Date): string {
  return `arac-takvimi-masraflar-${now.toISOString().slice(0, 10)}.csv`;
}
