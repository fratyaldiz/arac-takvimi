import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const PRO_STORE_VERSION = 1;

interface ProState {
  /** Tek seferlik satın alma yapıldı mı. */
  owned: boolean;
  purchasedAt: string | null;
  /** Mağazadan okunan yerelleştirilmiş fiyat; okunamadıysa null. */
  price: string | null;
  setOwned: (owned: boolean, purchasedAt?: string | null) => void;
  setPrice: (price: string | null) => void;
}

/**
 * Satın alma hakkı garaj verisinden ayrı tutulur: yedekten geri yükleme
 * kayıtları değiştirir ama Pro hakkını silmemeli. Doğrulama mağazanın kendi
 * kaydıyla yapılır ("geri yükle"), burada yalnız son bilinen durum saklanır.
 */
export const useProStore = create<ProState>()(
  persist(
    (set) => ({
      owned: false,
      purchasedAt: null,
      price: null,
      setOwned: (owned, purchasedAt = new Date().toISOString()) =>
        set({ owned, purchasedAt: owned ? purchasedAt : null }),
      setPrice: (price) => set({ price }),
    }),
    {
      name: 'arac-takvimi-pro',
      version: PRO_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ owned, purchasedAt }) => ({ owned, purchasedAt }),
    },
  ),
);

export function useIsPro(): boolean {
  return useProStore((s) => s.owned);
}
