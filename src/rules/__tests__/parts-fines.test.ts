import { makeFine, makePart, makeVehicle } from '../../testing/vehicle';
import { presetsFor } from '../parts';
import {
  computeDeadlines,
  deadlineStatus,
  fineDiscountDeadline,
  finePayableAmount,
  intervalText,
} from '../schedule';

const today = '2026-09-14';

function partDeadline(odometerKm: number | null, part = makePart()) {
  return computeDeadlines(makeVehicle({ odometerKm }), today, { parts: [part] }).find((d) => d.kind === 'parca');
}

describe('parça bakımı', () => {
  it('km ve tarihten acil olan durumu belirler', () => {
    const d = partDeadline(89500)!;
    expect(d.due).toBe('2027-03-01');
    expect(d.kmLeft).toBe(500);
    expect(deadlineStatus(d, today)).toBe('soon');
  });

  it('değişim km si geçtiyse gecikmiş', () => {
    const d = partDeadline(90500)!;
    expect(d.kmLeft).toBe(-500);
    expect(deadlineStatus(d, today)).toBe('overdue');
  });

  it('araç km si bilinmiyorsa yalnız tarihe bakılır', () => {
    const d = partDeadline(null)!;
    expect(d.kmLeft).toBeNull();
    expect(deadlineStatus(d, today)).toBe('ok');
  });

  it('yalnız km ye bağlı parça, km bilinmiyorsa listelenmez', () => {
    expect(partDeadline(null, makePart({ intervalMonths: null }))).toBeUndefined();
  });

  it('hiç yapılmamış parça listelenmez', () => {
    expect(partDeadline(85000, makePart({ lastKm: null, lastDate: null }))).toBeUndefined();
  });

  it('başka aracın parçası karışmaz', () => {
    expect(partDeadline(85000, makePart({ vehicleId: 'v2' }))).toBeUndefined();
  });

  it('km si yaklaşan iş, tarihi uzak işten önce sıralanır', () => {
    const v = makeVehicle({ odometerKm: 89500, trafficInsuranceDue: '2026-12-01' });
    const kinds = computeDeadlines(v, today, { parts: [makePart()] }).map((d) => d.kind);
    expect(kinds).toEqual(['parca', 'trafik']);
  });

  it('dizel araçta buji önerilmez', () => {
    expect(presetsFor('motorin').some((p) => p.kind === 'buji')).toBe(false);
    expect(presetsFor('benzin').some((p) => p.kind === 'buji')).toBe(true);
  });

  it('aralık metni', () => {
    expect(intervalText(10000, 12)).toBe('10.000 km ya da 12 ayda bir');
    expect(intervalText(30000, null)).toBe("30.000 km'de bir");
    expect(intervalText(null, 24)).toBe('24 ayda bir');
  });
});

describe('trafik cezası', () => {
  it('indirim son günü tebliğden 1 ay sonra', () => {
    expect(fineDiscountDeadline(makeFine())).toBe('2026-10-01');
  });

  it('son gün dahil %25 indirimli, sonrası tam tutar', () => {
    expect(finePayableAmount(makeFine(), '2026-10-01')).toBe(1500);
    expect(finePayableAmount(makeFine(), '2026-10-02')).toBe(2000);
  });

  it('ödenmemiş ceza takvimde indirimli tutarla görünür', () => {
    const d = computeDeadlines(makeVehicle(), today, { fines: [makeFine()] }).find((x) => x.kind === 'ceza')!;
    expect(d.due).toBe('2026-10-01');
    expect(d.title).toBe('Ceza: Hız');
    expect(d.subtitle).toContain('1.500,00 TL');
  });

  it('indirim süresi geçince uyarı değişir', () => {
    const d = computeDeadlines(makeVehicle(), '2026-10-05', { fines: [makeFine()] }).find((x) => x.kind === 'ceza')!;
    expect(d.subtitle.startsWith('İndirim süresi geçti')).toBe(true);
    expect(deadlineStatus(d, '2026-10-05')).toBe('overdue');
  });

  it('ödenmiş ceza listelenmez', () => {
    const fines = [makeFine({ paidDate: '2026-09-10', paidAmount: 1500 })];
    expect(computeDeadlines(makeVehicle(), today, { fines }).some((d) => d.kind === 'ceza')).toBe(false);
  });
});
