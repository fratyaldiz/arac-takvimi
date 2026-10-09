import { makeVehicle } from '../../testing/vehicle';
import type { GarageData } from '../../store/garage';
import { backupFileName, backupSummary, createBackup, parseBackup } from '../backup';

const data: GarageData = {
  vehicles: [makeVehicle()],
  expenses: [],
  parts: [],
  fines: [],
  documents: [],
  parking: null,
};

describe('yedek dosyası', () => {
  it('yazılan yedek geri okunur', () => {
    const backup = createBackup(data, new Date('2026-09-29T10:00:00Z'));
    const result = parseBackup(JSON.stringify(backup));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.vehicles[0].plate).toBe('34 ABC 123');
      expect(result.exportedAt).toBe('2026-09-29T10:00:00.000Z');
    }
  });

  it('dosya adında tarih var', () => {
    expect(backupFileName(new Date('2026-09-29T10:00:00Z'))).toBe('arac-takvimi-yedek-2026-09-29.json');
  });

  it('özet kayıt sayılarını verir', () => {
    expect(backupSummary(data)).toBe('1 araç · 0 masraf · 0 bakım kalemi · 0 ceza · 0 belge');
  });

  it('eski sürüm yedeği taşınır', () => {
    const old = {
      format: 'arac-takvimi-yedek',
      version: 1,
      exportedAt: '2026-09-01T00:00:00.000Z',
      data: { vehicles: [{ ...makeVehicle(), fuelType: undefined, color: undefined, odometerKm: undefined }] },
    };
    const result = parseBackup(JSON.stringify(old));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.vehicles[0]).toMatchObject({ fuelType: 'benzin', color: 'mavi', odometerKm: null });
  });

  it('yabancı ya da bozuk dosya reddedilir', () => {
    expect(parseBackup('{')).toMatchObject({ ok: false });
    expect(parseBackup('{"format":"baska-uygulama"}')).toMatchObject({ ok: false });
    expect(parseBackup('{"format":"arac-takvimi-yedek","version":2,"data":{}}')).toMatchObject({ ok: false });
  });

  it('daha yeni sürüm yedeği uyarı verir', () => {
    const future = JSON.stringify({ format: 'arac-takvimi-yedek', version: 99, data: { vehicles: [] } });
    const result = parseBackup(future);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('güncelle');
  });
});
