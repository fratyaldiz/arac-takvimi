import { makeVehicle } from '../../testing/vehicle';
import type { DeadlineKind, Vehicle } from '../../types';
import { addMonths, addYears, type ISODate } from '../../utils/date';
import { applyCompletion, computeDeadlines, estimateInspectionDue } from '../schedule';

function find(vehicle: Vehicle, today: ISODate, kind: DeadlineKind) {
  return computeDeadlines(vehicle, today).find((d) => d.kind === kind);
}

describe('tarih yardımcıları', () => {
  it('29 Şubat bir yıl sonra 28 Şubat olur', () => {
    expect(addYears('2024-02-29', 1)).toBe('2025-02-28');
  });

  it('ay sonu taşmaz', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
  });
});

describe('muayene', () => {
  it('erken muayenede yeni süre muayene gününden başlar, hususi araç 2 yıl', () => {
    const v = makeVehicle({ inspectionDue: '2026-10-01' });
    const d = find(v, '2026-09-14', 'muayene')!;
    expect(applyCompletion(v, d, '2026-09-20').inspectionDue).toBe('2028-09-20');
  });

  it('ticari araç her yıl muayene olur', () => {
    const v = makeVehicle({ kind: 'ticari', inspectionDue: '2026-10-01' });
    const d = find(v, '2026-09-14', 'muayene')!;
    expect(applyCompletion(v, d, '2026-09-20').inspectionDue).toBe('2027-09-20');
  });

  it('muayene tarihi yoksa iş listelenmez', () => {
    expect(find(makeVehicle(), '2026-09-14', 'muayene')).toBeUndefined();
  });

  it('sıfır hususi araç: ilk muayene tescilden 3 yıl sonra', () => {
    expect(estimateInspectionDue('2025-03-01', 'hususi', '2026-09-14')).toBe('2028-03-01');
  });

  it('eski hususi araç: 2 yıllık adımlarla bugünü geçen ilk tarih', () => {
    expect(estimateInspectionDue('2020-05-10', 'hususi', '2026-09-14')).toBe('2027-05-10');
  });

  it('ticari araç: ilk yıl sonra her yıl', () => {
    expect(estimateInspectionDue('2024-01-01', 'ticari', '2026-09-14')).toBe('2027-01-01');
  });
});

describe('sigorta', () => {
  it('erken yenilenen poliçe eski bitişten 1 yıl uzar', () => {
    const v = makeVehicle({ trafficInsuranceDue: '2026-10-05' });
    const d = find(v, '2026-09-14', 'trafik')!;
    expect(applyCompletion(v, d, '2026-09-20').trafficInsuranceDue).toBe('2027-10-05');
  });

  it('süresi geçmiş poliçe yenileme gününden başlar', () => {
    const v = makeVehicle({ trafficInsuranceDue: '2026-08-01' });
    const d = find(v, '2026-09-14', 'trafik')!;
    expect(applyCompletion(v, d, '2026-09-14').trafficInsuranceDue).toBe('2027-09-14');
  });
});

describe('MTV', () => {
  it('eylülde eklenen araçta ilk iş ocak taksiti', () => {
    const d = find(makeVehicle({ mtvEnabled: true }), '2026-09-14', 'mtv')!;
    expect(d.due).toBe('2027-01-31');
    expect(d.key).toBe('2027-1');
  });

  it('ocak ödenince temmuz taksiti gelir', () => {
    const d = find(makeVehicle({ mtvEnabled: true, mtvPaid: ['2027-1'] }), '2026-09-14', 'mtv')!;
    expect(d.due).toBe('2027-07-31');
  });

  it('ödenmemiş taksit gecikmiş olarak kalır', () => {
    const v = makeVehicle({ mtvEnabled: true, createdAt: '2026-01-10' });
    expect(find(v, '2026-02-05', 'mtv')!.due).toBe('2026-01-31');
  });

  it('ödendi işareti taksiti kapatır', () => {
    const v = makeVehicle({ mtvEnabled: true });
    const d = find(v, '2026-09-14', 'mtv')!;
    expect(applyCompletion(v, d, '2026-09-14').mtvPaid).toEqual(['2027-1']);
  });

  it('kapalıysa listelenmez', () => {
    expect(find(makeVehicle({ mtvEnabled: false }), '2026-09-14', 'mtv')).toBeUndefined();
  });
});

describe('lastik', () => {
  it('ticari araçta kış lastiği 15 Kasım ve zorunlu', () => {
    const d = find(makeVehicle({ kind: 'ticari', tireEnabled: true }), '2026-09-14', 'kisLastigi')!;
    expect(d.due).toBe('2026-11-15');
    expect(d.mandatory).toBe(true);
  });

  it('hususi araçta kış lastiği öneri', () => {
    const d = find(makeVehicle({ tireEnabled: true }), '2026-09-14', 'kisLastigi')!;
    expect(d.mandatory).toBe(false);
  });

  it('kış lastiği takılınca sıradaki iş 15 Nisan yaz lastiği', () => {
    const v = makeVehicle({ tireEnabled: true, tireDone: ['2026-kis'] });
    const d = find(v, '2026-12-01', 'yazLastigi')!;
    expect(d.due).toBe('2027-04-15');
  });

  it('kapanmış kış dönemi gösterilmez', () => {
    const v = makeVehicle({ tireEnabled: true });
    const deadlines = computeDeadlines(v, '2027-05-01');
    expect(deadlines.find((d) => d.kind === 'kisLastigi')).toBeUndefined();
    expect(deadlines.find((d) => d.kind === 'yazLastigi')!.key).toBe('2027-yaz');
  });
});

describe('bakım', () => {
  it('son bakımdan aralık kadar sonra', () => {
    const v = makeVehicle({ lastServiceDate: '2026-03-01', serviceIntervalMonths: 12 });
    const d = find(v, '2026-09-14', 'bakim')!;
    expect(d.due).toBe('2027-03-01');
    expect(applyCompletion(v, d, '2026-09-14').lastServiceDate).toBe('2026-09-14');
  });
});

describe('sıralama', () => {
  it('işler son tarihe göre sıralanır', () => {
    const v = makeVehicle({ inspectionDue: '2027-05-01', trafficInsuranceDue: '2026-10-01', mtvEnabled: true });
    expect(computeDeadlines(v, '2026-09-14').map((d) => d.kind)).toEqual(['trafik', 'mtv', 'muayene']);
  });
});
