import type { OpenSheet } from '../components/Sheet';
import { fineDiscountDeadline, finePayableAmount } from '../rules/schedule';
import type { PartItem, TrafficFine, Vehicle } from '../types';
import { formatTR, todayISO, type ISODate } from '../utils/date';

export function openCompletePart(
  openSheet: OpenSheet,
  part: PartItem,
  vehicle: Vehicle | undefined,
  completePart: (id: string, doneDate: ISODate, km: number | null, cost: number | null) => void,
) {
  const today = todayISO();
  openSheet({
    title: part.label,
    subtitle: 'Yapıldı olarak işaretle',
    date: { initial: today, max: today, label: 'Yapıldığı gün' },
    km: { initial: vehicle?.odometerKm ?? null, label: 'Yapıldığı km' },
    amount: { label: 'Tutar (isteğe bağlı)', initial: null },
    submitLabel: 'Kaydet',
    onSubmit: ({ date, km, amount }) => completePart(part.id, date ?? today, km, amount),
  });
}

export function openPayFine(
  openSheet: OpenSheet,
  fine: TrafficFine,
  payFine: (id: string, paidDate: ISODate, amount: number) => void,
) {
  const today = todayISO();
  openSheet({
    title: fine.reason ? `Ceza: ${fine.reason}` : 'Trafik cezası',
    subtitle: `İndirimli son gün: ${formatTR(fineDiscountDeadline(fine))}`,
    date: { initial: today, max: today, label: 'Ödeme günü' },
    amount: {
      label: 'Ödenen tutar',
      initial: finePayableAmount(fine, today),
      required: true,
      recompute: (date) => finePayableAmount(fine, date),
    },
    submitLabel: 'Ödendi',
    onSubmit: ({ date, amount }) => payFine(fine.id, date ?? today, amount ?? fine.amount),
  });
}

export function openOdometer(openSheet: OpenSheet, vehicle: Vehicle, setOdometer: (id: string, km: number) => void) {
  openSheet({
    title: 'Güncel kilometre',
    subtitle: vehicle.plate,
    km: { initial: vehicle.odometerKm, required: true, label: 'Kilometre' },
    submitLabel: 'Kaydet',
    onSubmit: ({ km }) => {
      if (km !== null) setOdometer(vehicle.id, km);
    },
  });
}
