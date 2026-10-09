import { makeVehicle } from '../../testing/vehicle';
import type { Expense } from '../../types';
import { CSV_BOM, csvFileName, expensesToCsv } from '../csv';

const vehicle = makeVehicle({ id: 'v1', name: 'Clio', plate: '34 ABC 123' });

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1',
    vehicleId: 'v1',
    date: '2026-09-20',
    category: 'bakim',
    amount: 1234.5,
    note: '',
    odometerKm: null,
    fuel: null,
    ...overrides,
  };
}

function rows(csv: string): string[] {
  return csv.replace(CSV_BOM, '').trimEnd().split('\r\n');
}

describe('masraf CSV', () => {
  it('Excel için BOM ve noktalı virgül kullanır', () => {
    const csv = expensesToCsv([makeExpense()], [vehicle]);
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(rows(csv)[0].split(';')[0]).toBe('Tarih');
  });

  it('tutarı Türkçe ondalıkla, binlik ayırıcısız yazar', () => {
    const csv = expensesToCsv([makeExpense({ amount: 12345.5 })], [vehicle]);
    expect(rows(csv)[1].split(';')[4]).toBe('12345,50');
  });

  it('yakıt alımının litre, birim fiyat ve depo bilgisini yazar', () => {
    const csv = expensesToCsv(
      [
        makeExpense({
          category: 'yakit',
          amount: 2000,
          odometerKm: 85000,
          fuel: { liters: 25.4, pricePerLiter: 78.74, fuelType: 'motorin', fullTank: true },
        }),
      ],
      [vehicle],
    );
    const cells = rows(csv)[1].split(';');
    expect(cells.slice(3, 10)).toEqual(['Yakıt', '2000,00', '85000', '25,40', '78,74', 'Motorin', 'Evet']);
  });

  it('noktalı virgül ve tırnak içeren notu kaçışlar', () => {
    const csv = expensesToCsv([makeExpense({ note: 'yağ; filtre "ek"' })], [vehicle]);
    expect(rows(csv)[1].endsWith('"yağ; filtre ""ek"""')).toBe(true);
  });

  it('kayıtları tarihe göre sıralar ve silinmiş aracı boş geçer', () => {
    const csv = expensesToCsv(
      [makeExpense({ id: 'b', date: '2026-09-25' }), makeExpense({ id: 'a', date: '2026-01-02', vehicleId: 'yok' })],
      [vehicle],
    );
    const lines = rows(csv);
    expect(lines[1].startsWith('2026-01-02;;;')).toBe(true);
    expect(lines[2].startsWith('2026-09-25;Clio;34 ABC 123')).toBe(true);
  });

  it('dosya adında tarih olur', () => {
    expect(csvFileName(new Date('2026-10-09T12:00:00Z'))).toBe('arac-takvimi-masraflar-2026-10-09.csv');
  });
});
