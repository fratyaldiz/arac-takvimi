import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { EMPTY_REVIEW_STATE, shouldAskForReview, type ReviewState } from '../review/prompt';
import { todayISO } from '../utils/date';

interface ReviewStore extends ReviewState {
  /** Uygulama her açıldığında sayaç artar. */
  registerLaunch: () => void;
  /** Olumlu bir andan sonra çağrılır; uygunsa sistem puan penceresini açar. */
  askIfDue: () => Promise<void>;
  dismiss: () => void;
}

function appVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}

export const useReview = create<ReviewStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_REVIEW_STATE,
      registerLaunch: () =>
        set((s) => ({ launches: s.launches + 1, firstLaunch: s.firstLaunch ?? todayISO() })),
      askIfDue: async () => {
        const today = todayISO();
        const version = appVersion();
        if (!shouldAskForReview(get(), today, version)) return;
        // Sistem penceresi gösterilmeyebilir (Apple yılda en fazla 3 kez gösterir);
        // yine de denenmiş sayılır, yoksa her açılışta tekrar denenir.
        set({ lastPrompt: today, lastPromptVersion: version });
        try {
          if (await StoreReview.hasAction()) await StoreReview.requestReview();
        } catch {
          // Puan penceresi açılmadıysa sessiz geçilir; kullanıcı akışı bölünmez.
        }
      },
      dismiss: () => set({ dismissed: true }),
    }),
    {
      name: 'arac-takvimi-puan',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ launches, firstLaunch, lastPrompt, lastPromptVersion, dismissed }): ReviewState => ({
        launches,
        firstLaunch,
        lastPrompt,
        lastPromptVersion,
        dismissed,
      }),
    },
  ),
);
