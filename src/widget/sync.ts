import { ExtensionStorage } from '@bacons/apple-targets';
import { Platform } from 'react-native';
import type { Deadline, Vehicle } from '../types';
import type { ISODate } from '../utils/date';
import { widgetPayload, WIDGET_APP_GROUP, WIDGET_STORAGE_KEY } from './payload';

/**
 * Ana ekran widget'ını günceller. Yalnız iOS'ta çalışır; diğer platformlarda
 * sessizce atlanır. Veri App Group üzerinden paylaşıldığı için sunucuya
 * hiçbir şey gitmez.
 */
export function syncWidget(deadlines: Deadline[], vehicles: Vehicle[], today: ISODate): void {
  if (Platform.OS !== 'ios') return;
  try {
    const storage = new ExtensionStorage(WIDGET_APP_GROUP);
    const payload = widgetPayload(deadlines, vehicles, today);
    if (payload) storage.set(WIDGET_STORAGE_KEY, JSON.stringify(payload));
    else storage.remove(WIDGET_STORAGE_KEY);
    ExtensionStorage.reloadWidget();
  } catch {
    // Widget güncellenemezse uygulama akışı etkilenmemeli.
  }
}
