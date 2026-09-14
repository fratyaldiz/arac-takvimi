import type { FuelType, PartKind } from '../types';

export interface PartPreset {
  kind: Exclude<PartKind, 'ozel'>;
  label: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  /** Yalnız bu yakıt türlerinde gösterilir (ör. dizelde buji yok). */
  fuelTypes?: FuelType[];
}

/**
 * Genel öneri değerleri; üreticiye ve kullanıma göre değişir. Kullanıcı her
 * kalemi aracının bakım kılavuzuna göre düzenleyebilir.
 */
export const PART_PRESETS: PartPreset[] = [
  { kind: 'yag', label: 'Motor yağı ve filtresi', intervalKm: 10000, intervalMonths: 12 },
  { kind: 'hava_filtresi', label: 'Hava filtresi', intervalKm: 20000, intervalMonths: 24 },
  { kind: 'polen_filtresi', label: 'Polen filtresi', intervalKm: 15000, intervalMonths: 12 },
  { kind: 'yakit_filtresi', label: 'Yakıt filtresi', intervalKm: 30000, intervalMonths: null },
  { kind: 'buji', label: 'Buji', intervalKm: 30000, intervalMonths: null, fuelTypes: ['benzin', 'lpg'] },
  { kind: 'balata', label: 'Fren balatası kontrolü', intervalKm: 30000, intervalMonths: null },
  { kind: 'fren_hidroligi', label: 'Fren hidroliği', intervalKm: null, intervalMonths: 24 },
  { kind: 'antifriz', label: 'Antifriz', intervalKm: null, intervalMonths: 24 },
  { kind: 'triger', label: 'Triger kayışı', intervalKm: 90000, intervalMonths: 60 },
  { kind: 'aku', label: 'Akü kontrolü', intervalKm: null, intervalMonths: 36 },
  { kind: 'lastik', label: 'Lastik değişimi', intervalKm: 40000, intervalMonths: 60 },
];

export function presetsFor(fuelType: FuelType): PartPreset[] {
  return PART_PRESETS.filter((p) => !p.fuelTypes || p.fuelTypes.includes(fuelType));
}
