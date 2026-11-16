import * as Calendar from 'expo-calendar';
import type { Deadline, Vehicle } from '../types';
import { parseISO } from '../utils/date';
import { calendarEventsFor } from './events';

export type CalendarResult =
  | { ok: true; added: number }
  | { ok: false; reason: 'permission' | 'nocalendar' | 'error' };

/** Hatırlatma, son tarihten bir gün önce sabah 9'da çalsın. */
const ALARM_MINUTES_BEFORE = 15 * 60;

/**
 * Son tarihleri telefonun takvimine tüm gün etkinliği olarak yazar.
 * Uygulama silinse bile kullanıcıda kayıt kalsın diye istenen bir özellik;
 * mevcut etkinlikler kontrol edilmez, tekrar basınca kopya oluşur.
 */
export async function exportDeadlinesToCalendar(deadlines: Deadline[], vehicles: Vehicle[]): Promise<CalendarResult> {
  const drafts = calendarEventsFor(deadlines, vehicles);
  if (drafts.length === 0) return { ok: true, added: 0 };

  try {
    const permission = await Calendar.requestCalendarPermissions();
    if (!permission.granted) return { ok: false, reason: 'permission' };

    const calendars = await Calendar.getCalendars();
    const target = calendars.find((c) => c.allowsModifications) ?? calendars[0];
    if (!target) return { ok: false, reason: 'nocalendar' };

    for (const draft of drafts) {
      const start = parseISO(draft.date);
      const end = new Date(start.getTime() + 86_400_000);
      await target.createEvent({
        title: draft.title,
        notes: draft.notes,
        startDate: start,
        endDate: end,
        allDay: true,
        alarms: [{ relativeOffset: -ALARM_MINUTES_BEFORE }],
      });
    }
    return { ok: true, added: drafts.length };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
