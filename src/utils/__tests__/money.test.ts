import { formatKm, formatNumberTR, formatTL, parseDecimalTR } from '../money';

describe('sayı biçimi', () => {
  it('binlik nokta, ondalık virgül', () => {
    expect(formatNumberTR(1234567.891, 2)).toBe('1.234.567,89');
    expect(formatTL(78.2)).toBe('78,20 TL');
    expect(formatKm(85000)).toBe('85.000 km');
    expect(formatNumberTR(-1500)).toBe('-1.500');
  });
});

describe('sayı girişi', () => {
  it('virgüllü ondalık', () => {
    expect(parseDecimalTR('1.234,5')).toBe(1234.5);
    expect(parseDecimalTR('78,23')).toBe(78.23);
  });

  it('binlik gruplu tam sayı', () => {
    expect(parseDecimalTR('85.000')).toBe(85000);
    expect(parseDecimalTR('1.250.000')).toBe(1250000);
  });

  it('noktalı ondalık', () => {
    expect(parseDecimalTR('78.23')).toBe(78.23);
    expect(parseDecimalTR(' 42 ')).toBe(42);
  });

  it('geçersiz giriş', () => {
    expect(parseDecimalTR('')).toBeNull();
    expect(parseDecimalTR('abc')).toBeNull();
    expect(parseDecimalTR('1,2,3')).toBeNull();
  });
});
