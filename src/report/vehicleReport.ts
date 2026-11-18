import { serviceLog } from '../expenses/history';
import { fuelConsumption } from '../expenses/stats';
import type { Expense, PartItem, Vehicle } from '../types';
import { formatTR, type ISODate } from '../utils/date';
import { formatKm, formatNumberTR, formatTL } from '../utils/money';
import { FUEL_LABEL, KIND_LABEL } from '../theme';

export interface VehicleReportInput {
  vehicle: Vehicle;
  expenses: Expense[];
  parts: PartItem[];
  today: ISODate;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Dosya adı: plaka ve tarih; aynı araç için günde bir dosya yeter. */
export function reportFileName(vehicle: Vehicle, today: ISODate): string {
  const plate = vehicle.plate.replace(/\s+/g, '-').toLowerCase();
  return `arac-raporu-${plate}-${today}.pdf`;
}

/**
 * İkinci el satışta alıcıya gösterilecek özet: aracın bilgileri, bakım
 * geçmişi, takip edilen kalemler ve masraf toplamı. Yalnız kullanıcının
 * girdiği kayıtlardan üretilir; resmi bir belge değildir.
 */
export function vehicleReportHtml({ vehicle, expenses, parts, today }: VehicleReportInput): string {
  const own = expenses.filter((e) => e.vehicleId === vehicle.id);
  const log = serviceLog(expenses, vehicle.id);
  const consumption = fuelConsumption(own);
  const total = own.reduce((sum, e) => sum + e.amount, 0);
  const serviceTotal = log.reduce((sum, e) => sum + e.amount, 0);
  const vehicleParts = parts.filter((p) => p.vehicleId === vehicle.id);

  const rows = log
    .map(
      (entry) => `<tr>
        <td>${escapeHtml(formatTR(entry.date))}</td>
        <td>${escapeHtml(entry.label || '—')}</td>
        <td class="num">${entry.odometerKm === null ? '—' : escapeHtml(formatKm(entry.odometerKm))}</td>
        <td class="num">${escapeHtml(formatTL(entry.amount, 0))}</td>
      </tr>`,
    )
    .join('');

  const partRows = vehicleParts
    .map(
      (part) => `<li>${escapeHtml(part.label)}${part.lastDate ? ` — son ${escapeHtml(formatTR(part.lastDate))}` : ''}${
        part.lastKm !== null ? ` — ${escapeHtml(formatKm(part.lastKm))}` : ''
      }</li>`,
    )
    .join('');

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Roboto, sans-serif; color: #0F172A; padding: 28px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 24px 0 8px; color: #2563EB; }
  .sub { color: #64748B; font-size: 12px; margin-bottom: 18px; }
  .grid { display: flex; flex-wrap: wrap; gap: 10px; }
  .box { flex: 1 1 30%; border: 1px solid #E2E8F0; border-radius: 10px; padding: 10px; }
  .label { font-size: 11px; color: #64748B; }
  .value { font-size: 15px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; border-bottom: 1px solid #E2E8F0; padding: 6px 4px; color: #64748B; font-weight: 600; }
  td { border-bottom: 1px solid #F1F5F9; padding: 6px 4px; }
  .num { text-align: right; }
  ul { font-size: 12px; padding-left: 18px; }
  .foot { margin-top: 24px; font-size: 10px; color: #94A3B8; line-height: 1.5; }
</style></head><body>
  <h1>${escapeHtml(vehicle.plate)}${vehicle.name ? ` · ${escapeHtml(vehicle.name)}` : ''}</h1>
  <div class="sub">${escapeHtml(KIND_LABEL[vehicle.kind])} · ${escapeHtml(FUEL_LABEL[vehicle.fuelType])} · rapor ${escapeHtml(
    formatTR(today),
  )}</div>

  <div class="grid">
    <div class="box"><div class="label">Kilometre</div><div class="value">${
      vehicle.odometerKm === null ? '—' : escapeHtml(formatKm(vehicle.odometerKm))
    }</div></div>
    <div class="box"><div class="label">Bakım/parça harcaması</div><div class="value">${escapeHtml(
      formatTL(serviceTotal, 0),
    )}</div></div>
    <div class="box"><div class="label">Toplam kayıtlı masraf</div><div class="value">${escapeHtml(
      formatTL(total, 0),
    )}</div></div>
    <div class="box"><div class="label">Ortalama tüketim</div><div class="value">${
      consumption ? `${escapeHtml(formatNumberTR(consumption.litersPer100Km, 1))} L/100 km` : '—'
    }</div></div>
    <div class="box"><div class="label">Muayene geçerlilik</div><div class="value">${
      vehicle.inspectionDue ? escapeHtml(formatTR(vehicle.inspectionDue)) : '—'
    }</div></div>
    <div class="box"><div class="label">Trafik sigortası</div><div class="value">${
      vehicle.trafficInsuranceDue ? escapeHtml(formatTR(vehicle.trafficInsuranceDue)) : '—'
    }</div></div>
  </div>

  <h2>Yapılan işler (${log.length})</h2>
  ${
    rows
      ? `<table><thead><tr><th>Tarih</th><th>İş</th><th class="num">Km</th><th class="num">Tutar</th></tr></thead><tbody>${rows}</tbody></table>`
      : '<div class="sub">Kayıtlı bakım, parça ya da lastik masrafı yok.</div>'
  }

  <h2>Takip edilen kalemler (${vehicleParts.length})</h2>
  ${partRows ? `<ul>${partRows}</ul>` : '<div class="sub">Takip edilen kalem yok.</div>'}

  <div class="foot">
    Bu rapor Araç Takvimi uygulamasındaki kullanıcı kayıtlarından üretilmiştir. Resmi bir belge değildir;
    muayene ve sigorta bilgilerini ruhsattan, TÜVTÜRK ve e-Devlet üzerinden doğrulayın.
  </div>
</body></html>`;
}
