import { en } from '../en';
import { languageFromDevice, missingTranslations, resolveLanguage, translate } from '../core';

describe('çeviri', () => {
  it('İngilizcede sözlükteki karşılığı verir', () => {
    expect(translate('en', 'Araç ekle')).toBe('Add vehicle');
  });

  it('Türkçede metni olduğu gibi bırakır', () => {
    expect(translate('tr', 'Araç ekle')).toBe('Araç ekle');
  });

  it('karşılığı yoksa Türkçeye düşer', () => {
    expect(translate('en', 'Bilinmeyen bir metin')).toBe('Bilinmeyen bir metin');
  });

  it('yer tutucuları doldurur', () => {
    expect(translate('tr', '{n} gün', { n: 12 })).toBe('12 gün');
    expect(translate('tr', '{n} gün', { gun: 12 })).toBe('{n} gün');
  });
});

describe('dil seçimi', () => {
  it('cihaz dili Türkçeyse Türkçe, değilse İngilizce', () => {
    expect(languageFromDevice('tr')).toBe('tr');
    expect(languageFromDevice('tr-TR')).toBe('tr');
    expect(languageFromDevice('en-US')).toBe('en');
    expect(languageFromDevice('de')).toBe('en');
    expect(languageFromDevice(null)).toBe('en');
  });

  it('kullanıcı seçimi sistem dilini ezer', () => {
    expect(resolveLanguage('system', 'en')).toBe('en');
    expect(resolveLanguage('tr', 'en')).toBe('tr');
    expect(resolveLanguage('en', 'tr')).toBe('en');
  });
});

describe('sözlük kapsamı', () => {
  it('temel ekran metinleri çevrilmiş', () => {
    const temel = [
      'Takvim',
      'Masraflar',
      'Garaj',
      'Yolda',
      'Araç ekle',
      'Kaydet',
      'Vazgeç',
      'Yaklaşanlar',
      'Araç muayenesi',
      'Trafik sigortası',
      'Akaryakıt fiyatları',
      'Yedekleme',
    ];
    expect(missingTranslations(temel)).toEqual([]);
  });

  it('sözlük boş değil', () => {
    expect(Object.keys(en).length).toBeGreaterThan(150);
  });
});
