import { makeVehicle } from '../../testing/vehicle';
import type { Expense } from '../../types';
import { buildReport, reportPeriods } from '../report';

const car = makeVehicle({ id: 'v1', name: 'Clio' });
const bike = makeVehicle({ id: 'v2', name: 'Motor', plate: '34 XY 55' });

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: Math.random().toString(36).slice(2),
    vehicleId: 'v1',
    date: '2026-05-10',
    category: 'bakim',
    amount: 100,
    note: '',
    odometerKm: null,
    fuel: null,
    ...overrides,
  };
}

describe('masraf raporu', () => {
  const expenses = [
    expense({ vehicleId: 'v1', date: '2026-02-01', amount: 2000, category: 'yakit', odometerKm: 80000 }),
    expense({ vehicleId: 'v1', date: '2026-06-01', amount: 3000, category: 'bakim', odometerKm: 90000 }),
    expense({ vehicleId: 'v2', date: '2026-03-01', amount: 500, category: 'sigorta' }),
    expense({ vehicleId: 'v1', date: '2025-12-31', amount: 9999, category: 'vergi' }),
  ];

  it('yalnız dönem içindeki kayıtları toplar', () => {
    const report = buildReport(expenses, [car, bike], '2026-01-01', '2026-12-31');
    expect(report.total).toBe(5500);
    expect(report.count).toBe(3);
  });

  it('araç kırılımını büyükten küçüğe sıralar', () => {
    const report = buildReport(expenses, [car, bike], '2026-01-01', '2026-12-31');
    expect(report.byVehicle.map((v) => v.vehicleId)).toEqual(['v1', 'v2']);
    expect(report.byVehicle[0].total).toBe(5000);
  });

  it('km okumalarından kilometre başına maliyeti çıkarır', () => {
    const report = buildReport(expenses, [car, bike], '2026-01-01', '2026-12-31');
    expect(report.byVehicle[0].kmDriven).toBe(10000);
    expect(report.byVehicle[0].costPerKm).toBeCloseTo(0.5);
  });

  it('tek km okuması varsa maliyet hesaplanmaz', () => {
    const report = buildReport(expenses, [bike], '2026-01-01', '2026-12-31');
    expect(report.byVehicle[0].kmDriven).toBeNull();
    expect(report.byVehicle[0].costPerKm).toBeNull();
  });

  it('kaydı olmayan aracı listelemez', () => {
    const report = buildReport([], [car, bike], '2026-01-01', '2026-12-31');
    expect(report.byVehicle).toEqual([]);
    expect(report.largest).toBeNull();
  });

  it('en pahalı masrafı bulur', () => {
    const report = buildReport(expenses, [car, bike], '2026-01-01', '2026-12-31');
    expect(report.largest?.amount).toBe(3000);
  });

  it('dönem seçenekleri bu yıl, geçen yıl ve tümü', () => {
    const periods = reportPeriods('2026-10-09', '2024-03-05');
    expect(periods.map((p) => p.label)).toEqual(['2026', '2025', 'Tümü']);
    expect(periods[0]).toMatchObject({ from: '2026-01-01', to: '2026-10-09' });
    expect(periods[1]).toMatchObject({ from: '2025-01-01', to: '2025-12-31' });
    expect(periods[2].from).toBe('2024-03-05');
  });
});
