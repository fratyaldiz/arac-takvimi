import type { IconName } from '../components/Icon';
import type { DocumentKind } from '../types';

export const DOCUMENT_META: Record<DocumentKind, { label: string; icon: IconName; color: string }> = {
  ruhsat: { label: 'Ruhsat', icon: 'card-account-details-outline', color: '#2563EB' },
  police: { label: 'Poliçe', icon: 'shield-car', color: '#4F46E5' },
  muayene: { label: 'Muayene', icon: 'clipboard-check-outline', color: '#0D9488' },
  fatura: { label: 'Fatura', icon: 'receipt', color: '#EA580C' },
  diger: { label: 'Diğer', icon: 'file-outline', color: '#64748B' },
};

export const DOCUMENT_KINDS: DocumentKind[] = ['ruhsat', 'police', 'muayene', 'fatura', 'diger'];

/** Dosya boyutunu okunur biçime çevirir. */
export function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}
