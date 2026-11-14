import { normalizePlate } from '../garage';

// Store AsyncStorage'a bağlanıyor; testte yerel taklidi kullanılır.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('plaka normalizasyonu', () => {
  it('küçük harfi büyütür, fazla boşluğu temizler', () => {
    expect(normalizePlate('  34 abc   123 ')).toBe('34 ABC 123');
  });

  it('noktalı İ yerine I yazar', () => {
    expect(normalizePlate('06 bİz 34')).toBe('06 BIZ 34');
    expect(normalizePlate('06 biz 34')).toBe('06 BIZ 34');
  });

  it('noktası ayrı karakter olarak gelen i de düzelir', () => {
    // Bazı klavyeler "i"yi i + U+0307 (birleşim noktası) olarak gönderiyor.
    expect(normalizePlate('06 bi̇z 34')).toBe('06 BIZ 34');
  });

  it('birleşmeyen işaretler plakayı bozmaz', () => {
    // NFC ile birleşebilen harfler olduğu gibi kalır; amaç yalnız noktalı i.
    expect(normalizePlate('34 i̇yi 1')).toBe('34 IYI 1');
  });
});
