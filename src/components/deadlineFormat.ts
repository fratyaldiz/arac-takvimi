import { SOON_THRESHOLD_DAYS, SOON_THRESHOLD_KM } from '../rules/regulations';
import type { Deadline } from '../types';
import { daysBetween, formatTR, relativeTR, type ISODate } from '../utils/date';
import { formatKm } from '../utils/money';

function dayRank(days: number): number {
  return days < 0 ? 0 : days <= SOON_THRESHOLD_DAYS ? 1 : 2;
}

function kmRank(km: number): number {
  return km < 0 ? 0 : km <= SOON_THRESHOLD_KM ? 1 : 2;
}

/** Tarih ve km'den hangisi daha acilse onun kısa metni: "12 gün", "800 km", "300 km geçti". */
export function deadlineBadge(deadline: Deadline, today: ISODate): string {
  const days = deadline.due ? daysBetween(today, deadline.due) : null;
  const km = deadline.kmLeft;
  if (km !== null && (days === null || kmRank(km) <= dayRank(days))) {
    return km < 0 ? `${formatKm(-km)} geçti` : formatKm(km);
  }
  return relativeTR(days ?? 0);
}

export function deadlineDateText(deadline: Deadline): string {
  return deadline.due ? formatTR(deadline.due) : 'Km takibi';
}

/** Halka doluluğu: 1 = zaman bol, 0 = son gün ya da geçmiş. */
export function urgency(deadline: Deadline, today: ISODate): number {
  const values: number[] = [];
  if (deadline.due) values.push(daysBetween(today, deadline.due) / 90);
  if (deadline.kmLeft !== null) values.push(deadline.kmLeft / 3000);
  return Math.max(0, Math.min(1, Math.min(...values)));
}
