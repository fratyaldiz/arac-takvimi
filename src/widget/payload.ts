import type { Deadline, Vehicle } from '../types';
import { daysBetween, formatTR, type ISODate } from '../utils/date';

/** Widget'ın okuduğu kayıt; App Group üzerinden paylaşılır. */
export interface WidgetPayload {
  title: string;
  subtitle: string;
  dateText: string;
  daysLeft: number | null;
}

export const WIDGET_APP_GROUP = 'group.com.aractakvimi.app';
export const WIDGET_STORAGE_KEY = 'nextDeadline';

/**
 * Ana ekran widget'ında gösterilecek en yakın iş. Listedeki ilk tarihli kayıt
 * alınır; yalnız km'ye bağlı işler (tarihi yok) widget'a yazılmaz.
 */
export function widgetPayload(deadlines: Deadline[], vehicles: Vehicle[], today: ISODate): WidgetPayload | null {
  const next = deadlines.find((d) => d.due !== null);
  if (!next || !next.due) return null;

  const plate = vehicles.find((v) => v.id === next.vehicleId)?.plate ?? '';
  return {
    title: next.title,
    subtitle: plate,
    dateText: formatTR(next.due),
    daysLeft: daysBetween(today, next.due),
  };
}
