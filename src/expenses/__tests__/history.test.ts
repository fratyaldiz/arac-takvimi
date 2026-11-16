import { makeVehicle } from '../../testing/vehicle';
import type { Expense } from '../../types';
import { compareVehicles, serviceLog } from '../history';

const car = makeVehicle({ id: 'v1' });
const van = makeVehicle({ id: 'v2', plate: '34 VAN 01' });

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

describe('servis defteri', () => {
  const expenses = [
    expense({ id: 'a', date: '2026-01-10', category: 'bakim', note: 'Yağ değişimi', amount: 2500, odometerKm: 80000 }),
    expense({ id: 'b', date: '2026-06-01', category: 'lastik', note: 'Kış lastiği', amount: 9000 }),
    expense({ id: 'c', date: '2026-03-01', category: 'yakit', note: 'Benzin', amount: 1500 }),
    expense({ id: 'd', date: '2026-02-01', category: 'otopark', amount: 60 }),
    expense({ id: 'e', vehicleId: 'v2', category: 'parca', note: 'Balata', amount: 3000 }),
  ];

  it('yalnız bakım, parça ve lastik kayıtlarını alır', () => {
    expect(serviceLog(expenses, 'v1').map((s) => s.id)).toEqual(['b', 'a']);
  });

  it('yeniden eskiye sıralar', () => {
    const log = serviceLog(expenses, 'v1');
    expect(log[0].date).toBe('2026-06-01');
    expect(log[1].date).toBe('2026-01-10');
  });

  it('km ve tutarı taşır', () => {
    const log = serviceLog(expenses, 'v1');
    expect(log[1]).toMatchObject({ label: 'Yağ değişimi', amount: 2500, odometerKm: 80000 });
  });

  it('başka aracın kaydını karıştırmaz', () => {
    expect(serviceLog(expenses, 'v2').map((s) => s.label)).toEqual(['Balata']);
  });
});

describe('araç karşılaştırma', () => {
  const expenses = [
    expense({ vehicleId: 'v1', date: '2026-02-01', amount: 2000, odometerKm: 80000 }),
    expense({ vehicleId: 'v1', date: '2026-06-01', amount: 3000, odometerKm: 90000 }),
    expense({ vehicleId: 'v2', date: '2026-03-01', amount: 500 }),
  ];

  it('pahalıdan ucuza sıralar', () => {
    const rows = compareVehicles(expenses, [van, car], '2026-01-01', '2026-12-31');
    expect(rows.map((r) => r.vehicleId)).toEqual(['v1', 'v2']);
  });

  it('km başına maliyeti hesaplar', () => {
    const rows = compareVehicles(expenses, [car], '2026-01-01', '2026-12-31');
    expect(rows[0].kmDriven).toBe(10000);
    expect(rows[0].costPerKm).toBeCloseTo(0.5);
  });

  it('km okuması tek ise maliyet null', () => {
    const rows = compareVehicles(expenses, [van], '2026-01-01', '2026-12-31');
    expect(rows[0].costPerKm).toBeNull();
  });

  it('kaydı olmayan aracı listelemez', () => {
    expect(compareVehicles([], [car, van], '2026-01-01', '2026-12-31')).toEqual([]);
  });

  it('dönem dışındaki kaydı saymaz', () => {
    const rows = compareVehicles(expenses, [car], '2026-03-01', '2026-12-31');
    expect(rows[0].total).toBe(3000);
  });
});
