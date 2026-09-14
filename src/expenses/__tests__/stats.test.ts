import type { Expense, FuelFill } from '../../types';
import { categoryTotals, fuelConsumption, monthlyTotals, sumBetween, tripCost } from '../stats';

let seq = 0;
function fill(date: string, km: number | null, liters: number, fullTank = true, price = 80): Expense {
  const fuel: FuelFill = { liters, pricePerLiter: price, fuelType: 'benzin', fullTank };
  return { id: `e${seq++}`, vehicleId: 'v1', date, category: 'yakit', amount: liters * price, note: '', odometerKm: km, fuel };
}
function expense(date: string, amount: number, category: Expense['category'] = 'bakim'): Expense {
  return { id: `e${seq++}`, vehicleId: 'v1', date, category, amount, note: '', odometerKm: null, fuel: null };
}

describe('yakıt tüketimi', () => {
  it('iki full depo arası litre / km', () => {
    const result = fuelConsumption([fill('2026-09-01', 10000, 40), fill('2026-09-10', 10500, 35)])!;
    expect(result.km).toBe(500);
    expect(result.liters).toBe(35);
    expect(result.litersPer100Km).toBeCloseTo(7);
    expect(result.costPerKm).toBeCloseTo(5.6);
  });

  it('kısmi alım sonraki full depoya eklenir', () => {
    const result = fuelConsumption([
      fill('2026-09-01', 10000, 40),
      fill('2026-09-05', 10200, 10, false),
      fill('2026-09-10', 10600, 26),
    ])!;
    expect(result.liters).toBe(36);
    expect(result.litersPer100Km).toBeCloseTo(6);
  });

  it('tek full depo ya da km yoksa hesaplanamaz', () => {
    expect(fuelConsumption([fill('2026-09-01', 10000, 40)])).toBeNull();
    expect(fuelConsumption([fill('2026-09-01', null, 40), fill('2026-09-10', null, 30)])).toBeNull();
  });

  it('ilk full depodan önceki kısmi alım sayılmaz', () => {
    const result = fuelConsumption([
      fill('2026-08-25', 9800, 15, false),
      fill('2026-09-01', 10000, 40),
      fill('2026-09-10', 10500, 35),
    ])!;
    expect(result.liters).toBe(35);
  });
});

describe('aylık toplam', () => {
  it('son 6 ay, bu ay dahil, eskiden yeniye', () => {
    const months = monthlyTotals(
      [expense('2026-09-02', 100), expense('2026-09-20', 50), expense('2026-04-10', 70), expense('2026-03-31', 999)],
      '2026-09-14',
    );
    expect(months.map((m) => m.month)).toEqual(['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']);
    expect(months[0]).toMatchObject({ label: 'Nis', total: 70 });
    expect(months[5].total).toBe(150);
  });

  it('yıl dönümünü aşar', () => {
    expect(monthlyTotals([], '2026-02-10', 3).map((m) => m.month)).toEqual(['2025-12', '2026-01', '2026-02']);
  });
});

describe('kategori ve dönem', () => {
  it('kategoriye göre büyükten küçüğe', () => {
    const totals = categoryTotals([expense('2026-09-01', 100, 'bakim'), expense('2026-09-02', 300, 'lastik'), expense('2026-09-03', 50, 'bakim')]);
    expect(totals).toEqual([
      { category: 'lastik', total: 300 },
      { category: 'bakim', total: 150 },
    ]);
  });

  it('tarih aralığı iki ucu dahil', () => {
    const list = [expense('2026-09-01', 10), expense('2026-09-30', 20), expense('2026-10-01', 40)];
    expect(sumBetween(list, '2026-09-01', '2026-09-30')).toBe(30);
  });
});

describe('yolculuk maliyeti', () => {
  it('gidiş-dönüş, otoyol ve kişi başı', () => {
    const result = tripCost({ distanceKm: 450, litersPer100Km: 6, pricePerLiter: 78, tolls: 300, people: 3, roundTrip: true });
    expect(result.km).toBe(900);
    expect(result.liters).toBeCloseTo(54);
    expect(result.fuelCost).toBeCloseTo(4212);
    expect(result.total).toBeCloseTo(4812);
    expect(result.perPerson).toBeCloseTo(1604);
  });

  it('kişi sayısı en az 1', () => {
    expect(tripCost({ distanceKm: 100, litersPer100Km: 5, pricePerLiter: 80, tolls: 0, people: 0, roundTrip: false }).perPerson).toBe(400);
  });
});
