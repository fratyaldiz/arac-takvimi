import type { ISODate } from './utils/date';

export type VehicleKind = 'hususi' | 'ticari' | 'motosiklet';

export type FuelType = 'benzin' | 'motorin' | 'lpg';

export const VEHICLE_COLOR_KEYS = ['mavi', 'mor', 'turuncu', 'yesil', 'kirmizi', 'lacivert', 'pembe', 'gri'] as const;
export type VehicleColor = (typeof VEHICLE_COLOR_KEYS)[number];

export interface Vehicle {
  id: string;
  plate: string;
  name: string;
  kind: VehicleKind;
  fuelType: FuelType;
  color: VehicleColor;
  /** Son bilinen kilometre; km'ye bağlı bakımlar buradan hesaplanır. */
  odometerKm: number | null;
  /** Ruhsattaki "muayene geçerlilik tarihi" */
  inspectionDue: ISODate | null;
  trafficInsuranceDue: ISODate | null;
  kaskoDue: ISODate | null;
  mtvEnabled: boolean;
  /** Ödenen taksitler: '2026-1', '2026-2' */
  mtvPaid: string[];
  tireEnabled: boolean;
  /** Tamamlanan lastik değişimleri: '2026-kis', '2027-yaz' */
  tireDone: string[];
  lastServiceDate: ISODate | null;
  serviceIntervalMonths: number;
  createdAt: ISODate;
}

export type ExpenseCategory =
  | 'yakit'
  | 'bakim'
  | 'parca'
  | 'lastik'
  | 'sigorta'
  | 'vergi'
  | 'ceza'
  | 'otopark'
  | 'otoyol'
  | 'yikama'
  | 'diger';

export interface FuelFill {
  liters: number;
  pricePerLiter: number;
  fuelType: FuelType;
  /** Depo tamamen dolduruldu mu; tüketim hesabı iki full depo arasında yapılır. */
  fullTank: boolean;
}

export interface Expense {
  id: string;
  vehicleId: string;
  date: ISODate;
  category: ExpenseCategory;
  /** TL */
  amount: number;
  note: string;
  odometerKm: number | null;
  fuel: FuelFill | null;
}

export type PartKind =
  | 'yag'
  | 'hava_filtresi'
  | 'polen_filtresi'
  | 'yakit_filtresi'
  | 'buji'
  | 'balata'
  | 'fren_hidroligi'
  | 'antifriz'
  | 'triger'
  | 'aku'
  | 'lastik'
  | 'ozel';

export interface PartItem {
  id: string;
  vehicleId: string;
  kind: PartKind;
  label: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  lastKm: number | null;
  lastDate: ISODate | null;
}

export interface TrafficFine {
  id: string;
  vehicleId: string;
  /** Tebliğ tarihi; indirim süresi buradan başlar. */
  noticeDate: ISODate;
  amount: number;
  reason: string;
  paidDate: ISODate | null;
  paidAmount: number | null;
}

export interface ParkingSession {
  vehicleId: string | null;
  /** ISO tarih-saat */
  startedAt: string;
  endsAt: string | null;
  latitude: number | null;
  longitude: number | null;
  note: string;
}

export type DeadlineKind =
  | 'muayene'
  | 'trafik'
  | 'kasko'
  | 'mtv'
  | 'kisLastigi'
  | 'yazLastigi'
  | 'bakim'
  | 'parca'
  | 'ceza';

export interface Deadline {
  /** `${vehicleId}:${kind}:${key}` */
  id: string;
  vehicleId: string;
  kind: DeadlineKind;
  /** Dönemli işlerde dönem anahtarı ('2026-1'), parça/cezada kayıt id'si, diğerlerinde 'current' */
  key: string;
  title: string;
  subtitle: string;
  /** Tarihe bağlı son gün; yalnız km'ye bağlı parçalarda null. */
  due: ISODate | null;
  /** Km'ye bağlı işlerde kalan km (araç km'si biliniyorsa). */
  kmLeft: number | null;
  mandatory: boolean;
}
