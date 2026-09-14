import { VEHICLE_COLOR_KEYS, type Vehicle } from '../types';
import type { GarageData } from './garage';

export const GARAGE_STORE_VERSION = 2;

/** v1 aracında olmayan alanlar */
type VehicleV1 = Omit<Vehicle, 'fuelType' | 'color' | 'odometerKm'> & Partial<Vehicle>;

/**
 * Kayıtlı veriyi güncel şemaya taşır. v1 yalnız araçları tutuyordu; yeni
 * alanlara varsayılan verilir, kullanıcının girdiği hiçbir değer silinmez.
 */
export function migrateGarage(persisted: unknown, version: number): GarageData {
  const state = (persisted ?? {}) as Partial<GarageData> & { vehicles?: VehicleV1[] };
  if (version < 2) {
    return {
      vehicles: (state.vehicles ?? []).map((v, i) => ({
        ...v,
        fuelType: v.fuelType ?? 'benzin',
        color: v.color ?? VEHICLE_COLOR_KEYS[i % VEHICLE_COLOR_KEYS.length],
        odometerKm: v.odometerKm ?? null,
      })),
      expenses: [],
      parts: [],
      fines: [],
      parking: null,
    };
  }
  return {
    vehicles: (state.vehicles ?? []) as Vehicle[],
    expenses: state.expenses ?? [],
    parts: state.parts ?? [],
    fines: state.fines ?? [],
    parking: state.parking ?? null,
  };
}
