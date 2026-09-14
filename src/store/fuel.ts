import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { fetchFuelPrices, isStale, type FuelPrices } from '../fuel/prices';

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
        if (get().loading) return;
        if (!force && !isStale(get().data, new Date())) return;
        set({ loading: true, error: null });
        try {
          set({ data: await fetchFuelPrices(), loading: false });
        } catch {
          set({ loading: false, error: 'Fiyatlar alınamadı. İnternet bağlantını kontrol et.' });
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
