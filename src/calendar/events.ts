import type { Deadline, Vehicle } from '../types';
import { formatTR, type ISODate } from '../utils/date';

export interface CalendarEventDraft {
  /** Takvimde görünecek başlık. */
  title: string;
  /** Tüm gün etkinliği; son tarihin günü. */
  date: ISODate;
  notes: string;
}

/** Takvime yazılacak etkinliğin adı; aramada uygulama adıyla bulunsun diye önek var. */
export const CALENDAR_EVENT_PREFIX = 'Araç Takvimi';

/**
 * Tarihe bağlı son tarihleri takvim etkinliğine çevirir. Yalnız km'ye bağlı
 * olmayan (günü belli) işler yazılır; aynı iş iki kez eklenmesin diye
 * başlık araç + iş adından türetilir.
 */
export function calendarEventsFor(deadlines: Deadline[], vehicles: Vehicle[]): CalendarEventDraft[] {
  const plateOf = new Map(vehicles.map((v) => [v.id, v.plate]));
  return deadlines
    .filter((d) => d.due !== null)
    .map((d) => {
      const plate = plateOf.get(d.vehicleId) ?? '';
      return {
        title: `${CALENDAR_EVENT_PREFIX}: ${plate ? `${plate} ` : ''}${d.title}`.trim(),
        date: d.due as ISODate,
        notes: `${d.subtitle}\nSon gün: ${formatTR(d.due as ISODate)}`,
      };
    });
}
