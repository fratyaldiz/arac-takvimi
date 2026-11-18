import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { resolveLanguage, translate, type Language, type LanguagePreference } from './core';

interface LanguageState {
  preference: LanguagePreference;
  setPreference: (preference: LanguagePreference) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: 'arac-takvimi-dil',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ preference }) => ({ preference }),
    },
  ),
);

/** Cihazın dili; okunamazsa Türkçe varsayılır. */
function deviceLanguage(): string {
  try {
    return getLocales()[0]?.languageCode ?? 'tr';
  } catch {
    return 'tr';
  }
}

export function useLanguage(): Language {
  const preference = useLanguageStore((s) => s.preference);
  return resolveLanguage(preference, deviceLanguage());
}

export type TranslateFn = (text: string, params?: Record<string, string | number>) => string;

/** Bileşenlerde kullanılan çeviri işlevi; dil değişince yeniden render eder. */
export function useT(): TranslateFn {
  const language = useLanguage();
  return (text, params) => translate(language, text, params);
}

/** Bileşen dışında (hesap katmanında) çeviri gerektiğinde. */
export function translateNow(text: string, params?: Record<string, string | number>): string {
  return translate(resolveLanguage(useLanguageStore.getState().preference, deviceLanguage()), text, params);
}
