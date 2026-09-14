/** Türkçe sayı biçimi: binlik ayırıcı nokta, ondalık virgül. */
export function formatNumberTR(value: number, decimals = 0): string {
  const fixed = Math.abs(value).toFixed(decimals);
  const [integer, fraction] = fixed.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${value < 0 ? '-' : ''}${grouped}${fraction ? `,${fraction}` : ''}`;
}

export function formatTL(value: number, decimals = 2): string {
  return `${formatNumberTR(value, decimals)} TL`;
}

export function formatKm(value: number): string {
  return `${formatNumberTR(Math.round(value))} km`;
}

/**
 * Kullanıcı girişini sayıya çevirir. Virgül varsa ondalık virgül kabul edilir
 * ("1.234,5"); yoksa "85.000" gibi binlik gruplu yazım tam sayı, "78.23" gibi
 * yazım ondalık sayılır.
 */
export function parseDecimalTR(input: string): number | null {
  const text = input.replace(/\s/g, '');
  if (!text) return null;
  let normalized: string;
  if (text.includes(',')) {
    normalized = text.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    normalized = text.replace(/\./g, '');
  } else {
    normalized = text;
  }
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
