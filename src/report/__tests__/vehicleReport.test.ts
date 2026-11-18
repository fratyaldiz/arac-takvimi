import { makePart, makeVehicle } from '../../testing/vehicle';
import type { Expense } from '../../types';
import { reportFileName, vehicleReportHtml } from '../vehicleReport';

const vehicle = makeVehicle({ id: 'v1', plate: '34 ABC 123', name: 'Egea', odometerKm: 92000, inspectionDue: '2028-11-14' });
const TODAY = '2026-11-17';

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: Math.random().toString(36).slice(2),
    vehicleId: 'v1',
    date: '2026-03-01',
    category: 'bakim',
    amount: 2500,
    note: 'Yağ değişimi',
    odometerKm: 88000,
    fuel: null,
    ...overrides,
  };
}

describe('araç raporu', () => {
  const expenses = [
    expense({}),
    expense({ category: 'yakit', amount: 3352, note: '', fuel: { liters: 40, pricePerLiter: 83.8, fuelType: 'benzin', fullTank: true } }),
  ];

  it('plaka, km ve muayene tarihini yazar', () => {
    const html = vehicleReportHtml({ vehicle, expenses, parts: [], today: TODAY });
    expect(html).toContain('34 ABC 123');
    expect(html).toContain('92.000 km');
    expect(html).toContain('14 Kasım 2028');
  });

  it('bakım harcamasını ve toplam masrafı ayrı verir', () => {
    const html = vehicleReportHtml({ vehicle, expenses, parts: [], today: TODAY });
    expect(html).toContain('2.500 TL');
    expect(html).toContain('5.852 TL');
  });

  it('servis satırlarını listeler, yakıtı listeye almaz', () => {
    const html = vehicleReportHtml({ vehicle, expenses, parts: [], today: TODAY });
    expect(html).toContain('Yağ değişimi');
    expect(html).toContain('Yapılan işler (1)');
  });

  it('takip edilen kalemleri yazar', () => {
    const html = vehicleReportHtml({ vehicle, expenses, parts: [makePart({ vehicleId: 'v1' })], today: TODAY });
    expect(html).toContain('Motor yağı ve filtresi');
    expect(html).toContain('Takip edilen kalemler (1)');
  });

  it('kayıt yoksa boş bilgisi verir', () => {
    const html = vehicleReportHtml({ vehicle, expenses: [], parts: [], today: TODAY });
    expect(html).toContain('Kayıtlı bakım, parça ya da lastik masrafı yok.');
  });

  it('HTML kaçışı yapar', () => {
    const risky = makeVehicle({ id: 'v1', plate: '34 <b>X</b>' });
    const html = vehicleReportHtml({ vehicle: risky, expenses: [], parts: [], today: TODAY });
    expect(html).toContain('34 &lt;b&gt;X&lt;/b&gt;');
    expect(html).not.toContain('<b>X</b>');
  });

  it('dosya adında plaka ve tarih olur', () => {
    expect(reportFileName(vehicle, TODAY)).toBe('arac-raporu-34-abc-123-2026-11-17.pdf');
  });
});
