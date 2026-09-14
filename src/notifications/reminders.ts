import { SOON_THRESHOLD_KM, REMINDER_HOUR, REMINDER_OFFSETS_DAYS } from '../rules/regulations';
import { computeDeadlines } from '../rules/schedule';
import type { ParkingSession, PartItem, TrafficFine, Vehicle } from '../types';
import { addDays, daysBetween, formatTR, parseISO, todayISO } from '../utils/date';
import { formatKm } from '../utils/money';

/** iOS en fazla 64 bekleyen yerel bildirim tutar; biraz pay bırakılır. */
export const MAX_SCHEDULED = 60;

/** Otopark süresi dolmadan bu kadar önce uyarılır. */
export const PARKING_WARNING_MINUTES = 10;

export interface PlannedReminder {
  at: Date;
  title: string;
  body: string;
  deadlineId: string;
}

export interface ReminderData {
  vehicles: Vehicle[];
  parts: PartItem[];
  fines: TrafficFine[];
  parking: ParkingSession | null;
}

function atReminderHour(date: Date): Date {
  const at = new Date(date);
  at.setHours(REMINDER_HOUR, 0, 0, 0);
  return at;
}

/** Bugün hatırlatma saati geçmediyse bugün, geçtiyse yarın. */
function nextSlot(now: Date): Date {
  const today = atReminderHour(now);
  if (today > now) return today;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

function offsetText(offset: number, due: string): string {
  if (offset === 0) return `Son gün bugün (${formatTR(due)}).`;
  if (offset === 1) return `Yarın son gün (${formatTR(due)}).`;
  return `${offset} gün kaldı · son gün ${formatTR(due)}.`;
}

/**
 * Tüm gelecek bildirimleri planlar. Süresi geçmiş işler için bir sonraki
 * hatırlatma saatinde ve bir hafta sonra tekrar hatırlatır; km'si yaklaşan
 * işler için bir kez hatırlatır.
 */
export function planReminders(data: ReminderData, now: Date, limit = MAX_SCHEDULED): PlannedReminder[] {
  const today = todayISO(now);
  const out: PlannedReminder[] = [];

  for (const vehicle of data.vehicles) {
    for (const deadline of computeDeadlines(vehicle, today, data)) {
      const title = `${vehicle.plate} · ${deadline.title}`;
      let dateOverdue = false;

      if (deadline.due) {
        const days = daysBetween(today, deadline.due);
        if (days < 0) {
          dateOverdue = true;
          const first = nextSlot(now);
          const body = `Süresi ${formatTR(deadline.due)} tarihinde doldu.`;
          out.push({ at: first, title, body, deadlineId: deadline.id });
          const weekLater = new Date(first);
          weekLater.setDate(weekLater.getDate() + 7);
          out.push({ at: weekLater, title, body, deadlineId: deadline.id });
        } else {
          for (const offset of REMINDER_OFFSETS_DAYS) {
            const at = atReminderHour(parseISO(addDays(deadline.due, -offset)));
            if (at <= now) continue;
            out.push({ at, title, body: offsetText(offset, deadline.due), deadlineId: deadline.id });
          }
        }
      }

      if (!dateOverdue && deadline.kmLeft !== null && deadline.kmLeft <= SOON_THRESHOLD_KM) {
        const body =
          deadline.kmLeft < 0 ? `Değişim km'si ${formatKm(-deadline.kmLeft)} geçti.` : `${formatKm(deadline.kmLeft)} kaldı.`;
        out.push({ at: nextSlot(now), title, body, deadlineId: deadline.id });
      }
    }
  }

  const parking = data.parking;
  if (parking?.endsAt) {
    const end = new Date(parking.endsAt);
    const warning = new Date(end.getTime() - PARKING_WARNING_MINUTES * 60_000);
    if (warning > now) {
      out.push({ at: warning, title: 'Otopark', body: `Süren ${PARKING_WARNING_MINUTES} dakika sonra doluyor.`, deadlineId: 'parking' });
    }
    if (end > now) {
      out.push({ at: end, title: 'Otopark', body: 'Otopark süren doldu.', deadlineId: 'parking' });
    }
  }

  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, limit);
}
