import { en } from './en';

export type Language = 'tr' | 'en';
/** Kullanıcı seçimi: sistem dilini takip et ya da sabitle. */
export type LanguagePreference = 'system' | Language;

/** Uygulamanın kaynak dili Türkçe; çeviri sözlüğü Türkçe metinden İngilizceye eşler. */
export type Dictionary = Record<string, string>;

const DICTIONARIES: Record<Language, Dictionary> = { tr: {}, en };

/** `{ad}` gibi yer tutucuları değerle doldurur. */
function fill(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
}

/**
 * Metni seçili dile çevirir. Sözlükte karşılığı yoksa Türkçe metin aynen
 * kullanılır; böylece çeviri eksik kalsa da ekran bozulmaz.
 */
export function translate(language: Language, text: string, params?: Record<string, string | number>): string {
  const dictionary = DICTIONARIES[language];
  return fill(dictionary[text] ?? text, params);
}

/** Cihaz dili Türkçe değilse İngilizce gösterilir. */
export function languageFromDevice(deviceLanguage: string | null | undefined): Language {
  return deviceLanguage?.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

export function resolveLanguage(preference: LanguagePreference, deviceLanguage: string | null | undefined): Language {
  return preference === 'system' ? languageFromDevice(deviceLanguage) : preference;
}

/** Çevirisi olmayan metinleri bulmak için; testte sözlük bütünlüğünü ölçer. */
export function missingTranslations(texts: string[]): string[] {
  return texts.filter((text) => !(text in en));
}
