import { makePart, makeVehicle } from '../../testing/vehicle';
import type { Vehicle } from '../../types';
import { toISO } from '../../utils/date';
import { MAX_SCHEDULED, planReminders, type ReminderData } from '../reminders';

function data(vehicles: Vehicle[], extra: Partial<ReminderData> = {}): ReminderData {
  return { vehicles, parts: [], fines: [], parking: null, ...extra };
}

describe('bildirim planı', () => {
  const now = new Date(2026, 8, 14, 12, 0); // 14 Eylül 2026 12:00

  it('geçmişte kalan hatırlatmaları atlar, saat 10:00 kurar', () => {
    const plan = planReminders(data([makeVehicle({ inspectionDue: '2026-09-20' })]), now);
    expect(plan.map((r) => toISO(r.at))).toEqual(['2026-09-19', '2026-09-20']);
    expect(plan.every((r) => r.at.getHours() === 10)).toBe(true);
    expect(plan[0].title).toBe('34 ABC 123 · Araç muayenesi');
  });

  it('süresi geçmiş iş için ertesi gün ve bir hafta sonra hatırlatır', () => {
    const plan = planReminders(data([makeVehicle({ inspectionDue: '2026-09-01' })]), now);
    expect(plan.map((r) => toISO(r.at))).toEqual(['2026-09-15', '2026-09-22']);
  });

  it('saat 10:00 geçmemişse gecikmiş iş aynı gün hatırlatılır', () => {
    const morning = new Date(2026, 8, 14, 8, 0);
    const plan = planReminders(data([makeVehicle({ inspectionDue: '2026-09-01' })]), morning);
    expect(toISO(plan[0].at)).toBe('2026-09-14');
  });

  it('iOS sınırı için en yakın hatırlatmalarla sınırlar', () => {
    const vehicles = Array.from({ length: 20 }, (_, i) =>
      makeVehicle({ id: `v${i}`, inspectionDue: '2027-06-01', trafficInsuranceDue: '2027-03-01' }),
    );
    const plan = planReminders(data(vehicles), now);
    expect(plan).toHaveLength(MAX_SCHEDULED);
    const times = plan.map((r) => r.at.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('km si yaklaşan parça için bir kez hatırlatır', () => {
    const vehicle = makeVehicle({ odometerKm: 89500 });
    const plan = planReminders(data([vehicle], { parts: [makePart({ intervalMonths: null })] }), now);
    expect(plan).toHaveLength(1);
    expect(plan[0].body).toBe('500 km kaldı.');
    expect(toISO(plan[0].at)).toBe('2026-09-15');
  });

  it('otopark bitmeden 10 dakika önce ve bitişte hatırlatır', () => {
    const endsAt = new Date(2026, 8, 14, 13, 0).toISOString();
    const plan = planReminders(
      data([], { parking: { vehicleId: null, startedAt: now.toISOString(), endsAt, latitude: null, longitude: null, note: '' } }),
      now,
    );
    expect(plan.map((r) => `${r.at.getHours()}:${r.at.getMinutes()}`)).toEqual(['12:50', '13:0']);
  });
});
