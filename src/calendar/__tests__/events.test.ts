import { makeVehicle } from '../../testing/vehicle';
import type { Deadline } from '../../types';
import { calendarEventsFor, CALENDAR_EVENT_PREFIX } from '../events';

const vehicle = makeVehicle({ id: 'v1', plate: '34 ABC 123' });

function deadline(overrides: Partial<Deadline> = {}): Deadline {
  return {
    id: 'v1:muayene:current',
    vehicleId: 'v1',
    kind: 'muayene',
    key: 'current',
    title: 'Araç muayenesi',
    subtitle: '2 yılda bir',
    due: '2027-03-01',
    kmLeft: null,
    mandatory: true,
    ...overrides,
  };
}

describe('takvim etkinlikleri', () => {
  it('plaka ve iş adıyla başlık üretir', () => {
    const [event] = calendarEventsFor([deadline()], [vehicle]);
    expect(event.title).toBe(`${CALENDAR_EVENT_PREFIX}: 34 ABC 123 Araç muayenesi`);
    expect(event.date).toBe('2027-03-01');
  });

  it('notta açıklama ve son günü yazar', () => {
    const [event] = calendarEventsFor([deadline()], [vehicle]);
    expect(event.notes).toContain('2 yılda bir');
    expect(event.notes).toContain('1 Mart 2027');
  });

  it('yalnız km’ye bağlı işleri atlar', () => {
    const km = deadline({ id: 'p1', kind: 'parca', due: null, kmLeft: 2000 });
    expect(calendarEventsFor([km], [vehicle])).toEqual([]);
  });

  it('silinmiş araçta plakasız başlık üretir', () => {
    const [event] = calendarEventsFor([deadline({ vehicleId: 'yok' })], [vehicle]);
    expect(event.title).toBe(`${CALENDAR_EVENT_PREFIX}: Araç muayenesi`);
  });

  it('kayıt yoksa boş liste döner', () => {
    expect(calendarEventsFor([], [vehicle])).toEqual([]);
  });
});
