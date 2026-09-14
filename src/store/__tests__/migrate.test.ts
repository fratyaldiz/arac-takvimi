import { migrateGarage } from '../migrate';

// İlk sürümün (SDK 54/57, v1) telefona yazdığı kayıt biçimi.
const v1Vehicle = {
  id: 'abc',
  plate: '34 ABC 123',
  name: 'Egea',
  kind: 'hususi',
  inspectionDue: '2027-05-10',
  trafficInsuranceDue: '2026-12-01',
  kaskoDue: null,
  mtvEnabled: true,
  mtvPaid: ['2027-1'],
  tireEnabled: false,
  tireDone: [],
  lastServiceDate: '2026-03-01',
  serviceIntervalMonths: 12,
  createdAt: '2026-09-14',
};

describe('kayıt taşıma', () => {
  it('v1 aracı korunur, yeni alanlar varsayılan alır', () => {
    const data = migrateGarage({ vehicles: [v1Vehicle] }, 1);
    expect(data.vehicles[0]).toEqual({ ...v1Vehicle, fuelType: 'benzin', color: 'mavi', odometerKm: null });
    expect(data).toMatchObject({ expenses: [], parts: [], fines: [], parking: null });
  });

  it('birden çok araca farklı renk verir', () => {
    const data = migrateGarage({ vehicles: [v1Vehicle, { ...v1Vehicle, id: 'def' }] }, 1);
    expect(data.vehicles.map((v) => v.color)).toEqual(['mavi', 'mor']);
  });

  it('boş ya da bozuk kayıttan boş garaj çıkar', () => {
    expect(migrateGarage(undefined, 1).vehicles).toEqual([]);
    expect(migrateGarage(null, 2)).toEqual({ vehicles: [], expenses: [], parts: [], fines: [], parking: null });
  });

  it('güncel sürüm verisine dokunmaz', () => {
    const current = {
      vehicles: [{ ...v1Vehicle, fuelType: 'motorin', color: 'yesil', odometerKm: 90000 }],
      expenses: [{ id: 'e1' }],
      parts: [],
      fines: [],
      parking: null,
    };
    expect(migrateGarage(current, 2)).toEqual(current);
  });
});
