import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { fetchFuelPrices, FuelTimeoutError, isStale, type FuelPrices } from '../fuel/prices';

interface FuelState {
  data: FuelPrices | null;
  loading: boolean;
  error: string | null;
  /** Veri bayatsa (ya da force ile her durumda) fiyatları yeniden çeker. */
  refresh: (force?: boolean) => Promise<void>;
}

export const useFuelPrices = create<FuelState>()(
  persist(
    (set, get) => ({
      data: null,
      loading: false,
      error: null,
      refresh: async (force = false) => {
        // Elle yenilemede bekleyen istek varsa da devam edilir: eski sürümde
        // asılı kalan bir istek loading'i kilitleyip yenilemeyi tamamen durduruyordu.
        if (get().loading && !force) return;
        if (!force && !isStale(get().data, new Date())) return;
        set({ loading: true, error: null });
        try {
          set({ data: await fetchFuelPrices(), error: null });
        } catch (error) {
          set({
            error:
              error instanceof FuelTimeoutError
                ? 'Fiyat servisi yanıt vermedi. Biraz sonra tekrar dene.'
                : 'Fiyatlar alınamadı. İnternet bağlantını kontrol et.',
          });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'arac-takvimi-yakit',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ data: s.data }),
    },
  ),
);
