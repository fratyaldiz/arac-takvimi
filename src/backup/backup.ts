import { migrateGarage } from '../store/migrate';
import type { GarageData } from '../store/garage';

export const BACKUP_FORMAT = 'arac-takvimi-yedek';
/** Kayıt şemasıyla aynı sürüm; eski yedekler taşıma kodundan geçirilir. */
export const BACKUP_VERSION = 3;

export interface BackupFile {
  format: string;
  version: number;
  exportedAt: string;
  data: GarageData;
}

export function createBackup(data: GarageData, now: Date): BackupFile {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), data };
}

export function backupFileName(now: Date): string {
  const date = now.toISOString().slice(0, 10);
  return `arac-takvimi-yedek-${date}.json`;
}

export function backupSummary(data: GarageData): string {
  const parts = [
    `${data.vehicles.length} araç`,
    `${data.expenses.length} masraf`,
    `${data.parts.length} bakım kalemi`,
    `${data.fines.length} ceza`,
    `${data.documents.length} belge`,
  ];
  return parts.join(' · ');
}

export type ParseResult = { ok: true; data: GarageData; exportedAt: string | null } | { ok: false; error: string };

/** Yedek dosyasını doğrular ve gerekirse güncel şemaya taşır. */
export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Dosya okunamadı. Geçerli bir yedek dosyası seç.' };
  }
  const file = json as Partial<BackupFile>;
  if (!file || typeof file !== 'object' || file.format !== BACKUP_FORMAT) {
    return { ok: false, error: 'Bu dosya Araç Takvimi yedeği değil.' };
  }
  const version = typeof file.version === 'number' ? file.version : 1;
  if (version > BACKUP_VERSION) {
    return { ok: false, error: 'Yedek, uygulamanın bu sürümünden yeni. Önce uygulamayı güncelle.' };
  }
  if (!file.data || typeof file.data !== 'object' || !Array.isArray((file.data as GarageData).vehicles)) {
    return { ok: false, error: 'Yedek dosyası bozuk görünüyor.' };
  }
  const data = migrateGarage(file.data, version);
  if (data.vehicles.some((v) => typeof v?.id !== 'string' || typeof v?.plate !== 'string')) {
    return { ok: false, error: 'Yedekteki araç kayıtları okunamadı.' };
  }
  return { ok: true, data, exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : null };
}
