import { makeVehicle } from '../../testing/vehicle';
import type { Deadline } from '../../types';
import { widgetPayload } from '../payload';

const vehicle = makeVehicle({ id: 'v1', plate: '34 ABC 123' });
const TODAY = '2026-11-18';

function deadline(overrides: Partial<Deadline> = {}): Deadline {
  return {
    id: 'v1:muayene:current',
    vehicleId: 'v1',
    kind: 'muayene',
    key: 'current',
    title: 'Araç muayenesi',
    subtitle: '2 yılda bir',
    due: '2026-12-01',
    kmLeft: null,
    mandatory: true,
    ...overrides,
  };
}

describe('widget verisi', () => {
  it('en yakın işi plakasıyla verir', () => {
    const payload = widgetPayload([deadline()], [vehicle], TODAY)!;
    expect(payload).toMatchObject({ title: 'Araç muayenesi', subtitle: '34 ABC 123', dateText: '1 Aralık 2026' });
    expect(payload.daysLeft).toBe(13);
  });

  it('geçmiş tarihte negatif gün döner', () => {
    const payload = widgetPayload([deadline({ due: '2026-11-10' })], [vehicle], TODAY)!;
    expect(payload.daysLeft).toBe(-8);
  });

  it('km’ye bağlı işi atlayıp tarihli olanı seçer', () => {
    const km = deadline({ id: 'p1', kind: 'parca', title: 'Motor yağı', due: null, kmLeft: 1500 });
    const payload = widgetPayload([km, deadline()], [vehicle], TODAY)!;
    expect(payload.title).toBe('Araç muayenesi');
  });

  it('tarihli iş yoksa null döner', () => {
    const km = deadline({ due: null, kmLeft: 1500 });
    expect(widgetPayload([km], [vehicle], TODAY)).toBeNull();
    expect(widgetPayload([], [vehicle], TODAY)).toBeNull();
  });

  it('silinmiş araçta plaka boş kalır', () => {
    expect(widgetPayload([deadline({ vehicleId: 'yok' })], [vehicle], TODAY)?.subtitle).toBe('');
  });
});
