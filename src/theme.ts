import { DynamicColorIOS, Platform } from 'react-native';
import type { IconName } from './components/Icon';
import type { DeadlineStatus } from './rules/schedule';
import type { DeadlineKind, ExpenseCategory, FuelType, PartKind, VehicleColor, VehicleKind } from './types';

/**
 * Karanlık mod: iOS'ta DynamicColorIOS rengi çizim anında sistem temasına göre
 * seçer, böylece stil tanımlarını değiştirmeye gerek kalmaz. Android ve web
 * bu API'yi desteklemediği için açık tema değerinde kalır.
 */
function dynamic(light: string, dark: string): string {
  return Platform.OS === 'ios' ? (DynamicColorIOS({ light, dark }) as unknown as string) : light;
}

export const colors = {
  bg: dynamic('#F3F5FA', '#0B1120'),
  card: dynamic('#FFFFFF', '#172033'),
  text: dynamic('#0F172A', '#F1F5F9'),
  muted: dynamic('#64748B', '#94A3B8'),
  border: dynamic('#E2E8F0', '#2A3650'),
  primary: dynamic('#2563EB', '#60A5FA'),
  primarySoft: dynamic('#DBEAFE', '#1E3A8A'),
  danger: dynamic('#DC2626', '#F87171'),
  dangerSoft: dynamic('#FEE2E2', '#4C1D1D'),
  warn: dynamic('#B45309', '#FBBF24'),
  warnSoft: dynamic('#FEF3C7', '#4A3410'),
  ok: dynamic('#047857', '#34D399'),
  okSoft: dynamic('#D1FAE5', '#064E3B'),
  plateBlue: '#0038A8',
};

export const radius = 18;

export const shadow = {
  shadowColor: '#0F172A',
  // Koyu temada gölge görünmez; açık temadaki yumuşaklık korunur.
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const STATUS_COLORS: Record<DeadlineStatus, { fg: string; bg: string }> = {
  overdue: { fg: colors.danger, bg: colors.dangerSoft },
  soon: { fg: colors.warn, bg: colors.warnSoft },
  ok: { fg: colors.ok, bg: colors.okSoft },
};

export const KIND_LABEL: Record<VehicleKind, string> = {
  hususi: 'Hususi otomobil',
  ticari: 'Ticari araç',
  motosiklet: 'Motosiklet',
};

export const FUEL_LABEL: Record<FuelType, string> = {
  benzin: 'Benzin',
  motorin: 'Motorin',
  lpg: 'LPG',
};

export const FUEL_COLORS: Record<FuelType, [string, string]> = {
  benzin: ['#F97316', '#FBBF24'],
  motorin: ['#0F766E', '#2DD4BF'],
  lpg: ['#2563EB', '#60A5FA'],
};

export const VEHICLE_GRADIENTS: Record<VehicleColor, [string, string]> = {
  mavi: ['#2563EB', '#38BDF8'],
  mor: ['#7C3AED', '#C084FC'],
  turuncu: ['#EA580C', '#FBBF24'],
  yesil: ['#059669', '#34D399'],
  kirmizi: ['#DC2626', '#FB7185'],
  lacivert: ['#1E3A8A', '#6366F1'],
  pembe: ['#DB2777', '#F472B6'],
  gri: ['#334155', '#94A3B8'],
};

export const DEADLINE_META: Record<DeadlineKind, { icon: IconName; color: string; bg: string }> = {
  muayene: { icon: 'clipboard-check-outline', color: '#0D9488', bg: '#CCFBF1' },
  trafik: { icon: 'shield-car', color: '#2563EB', bg: '#DBEAFE' },
  kasko: { icon: 'shield-check-outline', color: '#4F46E5', bg: '#E0E7FF' },
  mtv: { icon: 'cash-multiple', color: '#16A34A', bg: '#DCFCE7' },
  kisLastigi: { icon: 'snowflake', color: '#0284C7', bg: '#E0F2FE' },
  yazLastigi: { icon: 'white-balance-sunny', color: '#D97706', bg: '#FEF3C7' },
  bakim: { icon: 'wrench-outline', color: '#EA580C', bg: '#FFEDD5' },
  parca: { icon: 'cog-outline', color: '#9333EA', bg: '#F3E8FF' },
  ceza: { icon: 'alert-octagon-outline', color: '#DC2626', bg: '#FEE2E2' },
};

export const EXPENSE_META: Record<ExpenseCategory, { label: string; icon: IconName; color: string }> = {
  yakit: { label: 'Yakıt', icon: 'gas-station', color: '#F97316' },
  bakim: { label: 'Bakım', icon: 'wrench-outline', color: '#8B5CF6' },
  parca: { label: 'Parça', icon: 'cog-outline', color: '#6366F1' },
  lastik: { label: 'Lastik', icon: 'tire', color: '#0EA5E9' },
  sigorta: { label: 'Sigorta', icon: 'shield-car', color: '#2563EB' },
  vergi: { label: 'Vergi', icon: 'bank-outline', color: '#16A34A' },
  ceza: { label: 'Ceza', icon: 'alert-octagon-outline', color: '#DC2626' },
  otopark: { label: 'Otopark', icon: 'parking', color: '#0891B2' },
  otoyol: { label: 'Köprü/otoyol', icon: 'highway', color: '#65A30D' },
  yikama: { label: 'Yıkama', icon: 'car-wash', color: '#06B6D4' },
  diger: { label: 'Diğer', icon: 'dots-horizontal-circle-outline', color: '#64748B' },
};

export const PART_ICON: Record<PartKind, IconName> = {
  yag: 'oil',
  hava_filtresi: 'air-filter',
  polen_filtresi: 'fan',
  yakit_filtresi: 'filter-outline',
  buji: 'flash-outline',
  balata: 'car-brake-alert',
  fren_hidroligi: 'water-outline',
  antifriz: 'coolant-temperature',
  triger: 'engine-outline',
  aku: 'car-battery',
  lastik: 'tire',
  ozel: 'wrench-outline',
};
