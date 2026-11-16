import { parseDotCode, tireAdvice, TIRE_MAX_AGE_YEARS, TIRE_REPLACE_AGE_YEARS } from '../tire';

const TODAY = '2026-11-16';

describe('DOT kodu', () => {
  it('hafta ve yılı okur', () => {
    const age = parseDotCode('2320', TODAY)!;
    expect(age.week).toBe(23);
    expect(age.year).toBe(2020);
    expect(age.ageYears).toBeCloseTo(6.45, 1);
  });

  it('boşlukları yok sayar', () => {
    expect(parseDotCode(' 01 25 ', TODAY)?.year).toBe(2025);
  });

  it('gelecekteki yılı bir önceki yüzyıla çeker', () => {
    // 2099 olamaz; 1999 üretimi kabul edilir.
    expect(parseDotCode('0199', TODAY)?.year).toBe(1999);
  });

  it('geçersiz girişte null döner', () => {
    expect(parseDotCode('abcd', TODAY)).toBeNull();
    expect(parseDotCode('0020', TODAY)).toBeNull();
    expect(parseDotCode('5420', TODAY)).toBeNull();
    expect(parseDotCode('123', TODAY)).toBeNull();
  });

  it('henüz gelmemiş üretim haftasını kabul etmez', () => {
    expect(parseDotCode('5226', TODAY)).toBeNull();
  });
});

describe('lastik yaşı uyarısı', () => {
  const at = (years: number) => ({ week: 1, year: 2000, producedOn: '2000-01-01', ageYears: years });

  it('6 yıldan yeni lastik sorunsuz', () => {
    expect(tireAdvice(at(TIRE_REPLACE_AGE_YEARS - 0.1))).toBe('ok');
  });

  it('6 yılı geçince değişim önerilir', () => {
    expect(tireAdvice(at(TIRE_REPLACE_AGE_YEARS))).toBe('aging');
  });

  it('10 yılı geçen lastik kullanılmamalı', () => {
    expect(tireAdvice(at(TIRE_MAX_AGE_YEARS))).toBe('replace');
  });
});
