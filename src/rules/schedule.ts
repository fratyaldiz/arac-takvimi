import type { Deadline, DeadlineKind, PartItem, TrafficFine, Vehicle, VehicleKind } from '../types';
import {
  addMonths,
  addYears,
  daysBetween,
  daysInMonth,
  formatDayMonthTR,
  makeISO,
  maxISO,
  type ISODate,
} from '../utils/date';
import { formatKm, formatTL } from '../utils/money';
import {
  FINE_DISCOUNT_MONTHS,
  FINE_DISCOUNT_PERCENT,
  FINE_LATE_PERCENT_PER_MONTH,
  INSPECTION_LATE_FEE_PERCENT_PER_MONTH,
  INSPECTION_PERIOD_YEARS,
  INSURANCE_TERM_YEARS,
  MTV_INSTALLMENTS,
  SOON_THRESHOLD_DAYS,
  SOON_THRESHOLD_KM,
  WINTER_TIRE,
} from './regulations';

export type DeadlineStatus = 'overdue' | 'soon' | 'ok';

const STATUS_RANK: Record<DeadlineStatus, number> = { overdue: 0, soon: 1, ok: 2 };

export const COMPLETE_LABEL: Record<DeadlineKind, string> = {
  muayene: 'Yaptırdım',
  trafik: 'Yeniledim',
  kasko: 'Yeniledim',
  mtv: 'Ödedim',
  kisLastigi: 'Taktım',
  yazLastigi: 'Taktım',
  bakim: 'Yaptırdım',
  parca: 'Yaptırdım',
  ceza: 'Ödedim',
};

/** Tamamlanırken tarih sorulan araç işleri; diğerleri yalnızca işaretlenir. */
export const NEEDS_DATE: Record<DeadlineKind, boolean> = {
  muayene: true,
  trafik: true,
  kasko: true,
  mtv: false,
  kisLastigi: false,
  yazLastigi: false,
  bakim: true,
  parca: true,
  ceza: true,
};

/** Tarih ve km durumundan hangisi daha acilse o geçerli. */
export function deadlineStatus(deadline: Deadline, today: ISODate): DeadlineStatus {
  let status: DeadlineStatus = 'ok';
  if (deadline.due) {
    const days = daysBetween(today, deadline.due);
    status = days < 0 ? 'overdue' : days <= SOON_THRESHOLD_DAYS ? 'soon' : 'ok';
  }
  if (deadline.kmLeft !== null) {
    const km: DeadlineStatus =
      deadline.kmLeft < 0 ? 'overdue' : deadline.kmLeft <= SOON_THRESHOLD_KM ? 'soon' : 'ok';
    if (STATUS_RANK[km] < STATUS_RANK[status]) status = km;
  }
  return status;
}

/** Önce durum (geçmiş, yaklaşan, normal), sonra tarih, sonra kalan km. */
export function compareDeadlines(today: ISODate) {
  return (a: Deadline, b: Deadline): number => {
    const rank = STATUS_RANK[deadlineStatus(a, today)] - STATUS_RANK[deadlineStatus(b, today)];
    if (rank !== 0) return rank;
    if (a.due !== b.due) {
      if (a.due === null) return 1;
      if (b.due === null) return -1;
      return a.due < b.due ? -1 : 1;
    }
    return (a.kmLeft ?? Infinity) - (b.kmLeft ?? Infinity);
  };
}

function make(
  vehicle: Vehicle,
  kind: DeadlineKind,
  key: string,
  title: string,
  subtitle: string,
  due: ISODate | null,
  mandatory: boolean,
  kmLeft: number | null = null,
): Deadline {
  return { id: `${vehicle.id}:${kind}:${key}`, vehicleId: vehicle.id, kind, key, title, subtitle, due, kmLeft, mandatory };
}

function periodText(years: number): string {
  return years === 1 ? 'Her yıl' : `${years} yılda bir`;
}

export function intervalText(km: number | null, months: number | null): string {
  if (km && months) return `${formatKm(km)} ya da ${months} ayda bir`;
  if (km) return `${formatKm(km)}'de bir`;
  if (months) return `${months} ayda bir`;
  return '';
}

interface Period {
  key: string;
  due: ISODate;
  /** Bu tarihten sonra dönem kapanır, artık gösterilmez. */
  closes?: ISODate;
  label: string;
}

/**
 * Araç eklenmeden önce dolmuş dönemler yapılmış sayılır. Kapanmış dönemler
 * atlanır; kalanlar içinde tamamlanmamış en erken dönem döner.
 */
function firstOpenPeriod(periods: Period[], done: string[], since: ISODate, today: ISODate): Period | undefined {
  return periods
    .filter((p) => p.due >= since && !done.includes(p.key) && (!p.closes || today < p.closes))
    .sort((a, b) => (a.due < b.due ? -1 : 1))[0];
}

function mtvPeriods(fromYear: number, toYear: number): Period[] {
  const out: Period[] = [];
  for (let year = fromYear; year <= toYear; year++) {
    for (const { index, month } of MTV_INSTALLMENTS) {
      out.push({
        key: `${year}-${index}`,
        due: makeISO(year, month, daysInMonth(year, month)),
        label: `${year} ${index}. taksit`,
      });
    }
  }
  return out;
}

function tirePeriods(fromYear: number, toYear: number): Period[] {
  const { start, end } = WINTER_TIRE;
  const out: Period[] = [];
  for (let year = fromYear; year <= toYear; year++) {
    out.push({
      key: `${year}-yaz`,
      due: makeISO(year, end.month, end.day),
      closes: makeISO(year, start.month, start.day),
      label: 'yaz',
    });
    out.push({
      key: `${year}-kis`,
      due: makeISO(year, start.month, start.day),
      closes: makeISO(year + 1, end.month, end.day),
      label: 'kis',
    });
  }
  return out;
}

function partDeadline(vehicle: Vehicle, part: PartItem): Deadline | null {
  const due = part.intervalMonths && part.lastDate ? addMonths(part.lastDate, part.intervalMonths) : null;
  const dueKm = part.intervalKm && part.lastKm !== null ? part.lastKm + part.intervalKm : null;
  const kmLeft = dueKm !== null && vehicle.odometerKm !== null ? dueKm - vehicle.odometerKm : null;
  if (!due && kmLeft === null) return null;
  return make(
    vehicle,
    'parca',
    part.id,
    part.label,
    intervalText(part.intervalKm, part.intervalMonths),
    due,
    false,
    kmLeft,
  );
}

export function fineDiscountDeadline(fine: TrafficFine): ISODate {
  return addMonths(fine.noticeDate, FINE_DISCOUNT_MONTHS);
}

/** İndirim süresi içinde (son gün dahil) %25 indirimli tutar, sonrasında tam tutar. */
export function finePayableAmount(fine: TrafficFine, payDate: ISODate): number {
  if (payDate > fineDiscountDeadline(fine)) return fine.amount;
  return Math.round(fine.amount * (100 - FINE_DISCOUNT_PERCENT)) / 100;
}

function fineDeadline(vehicle: Vehicle, fine: TrafficFine, today: ISODate): Deadline {
  const due = fineDiscountDeadline(fine);
  const subtitle =
    today <= due
      ? `%${FINE_DISCOUNT_PERCENT} indirimle ${formatTL(finePayableAmount(fine, today))}`
      : `İndirim süresi geçti · aylık %${FINE_LATE_PERCENT_PER_MONTH} faiz işler`;
  return make(vehicle, 'ceza', fine.id, fine.reason ? `Ceza: ${fine.reason}` : 'Trafik cezası', subtitle, due, true);
}

export interface RelatedRecords {
  parts?: PartItem[];
  fines?: TrafficFine[];
}

export function computeDeadlines(vehicle: Vehicle, today: ISODate, related: RelatedRecords = {}): Deadline[] {
  const out: Deadline[] = [];
  const fromYear = Number(vehicle.createdAt.slice(0, 4));
  const toYear = Number(today.slice(0, 4)) + 1;

  if (vehicle.inspectionDue) {
    const { then } = INSPECTION_PERIOD_YEARS[vehicle.kind];
    out.push(
      make(
        vehicle,
        'muayene',
        'current',
        'Araç muayenesi',
        `${periodText(then)} · gecikmede ayda %${INSPECTION_LATE_FEE_PERCENT_PER_MONTH} zam`,
        vehicle.inspectionDue,
        true,
      ),
    );
  }

  if (vehicle.trafficInsuranceDue) {
    out.push(
      make(vehicle, 'trafik', 'current', 'Trafik sigortası', 'Zorunlu · yıllık yenilenir', vehicle.trafficInsuranceDue, true),
    );
  }

  if (vehicle.kaskoDue) {
    out.push(make(vehicle, 'kasko', 'current', 'Kasko', 'Yıllık yenilenir', vehicle.kaskoDue, false));
  }

  if (vehicle.mtvEnabled) {
    const period = firstOpenPeriod(mtvPeriods(fromYear, toYear), vehicle.mtvPaid, vehicle.createdAt, today);
    if (period) {
      out.push(make(vehicle, 'mtv', period.key, 'MTV', `${period.label} · ay sonuna kadar`, period.due, true));
    }
  }

  if (vehicle.tireEnabled) {
    const period = firstOpenPeriod(tirePeriods(fromYear, toYear), vehicle.tireDone, vehicle.createdAt, today);
    if (period) {
      const range = `${formatDayMonthTR(WINTER_TIRE.start.month, WINTER_TIRE.start.day)} – ${formatDayMonthTR(
        WINTER_TIRE.end.month,
        WINTER_TIRE.end.day,
      )}`;
      if (period.label === 'kis') {
        const mandatory = vehicle.kind === 'ticari';
        out.push(
          make(
            vehicle,
            'kisLastigi',
            period.key,
            'Kış lastiği',
            `${mandatory ? 'Ticari araçta zorunlu' : 'Önerilir'} · ${range}`,
            period.due,
            mandatory,
          ),
        );
      } else {
        out.push(make(vehicle, 'yazLastigi', period.key, 'Yaz lastiğine geçiş', `Kış dönemi bitti · ${range}`, period.due, false));
      }
    }
  }

  if (vehicle.lastServiceDate) {
    out.push(
      make(
        vehicle,
        'bakim',
        'current',
        'Periyodik bakım',
        `Her ${vehicle.serviceIntervalMonths} ayda bir`,
        addMonths(vehicle.lastServiceDate, vehicle.serviceIntervalMonths),
        false,
      ),
    );
  }

  for (const part of related.parts ?? []) {
    if (part.vehicleId !== vehicle.id) continue;
    const deadline = partDeadline(vehicle, part);
    if (deadline) out.push(deadline);
  }

  for (const fine of related.fines ?? []) {
    if (fine.vehicleId === vehicle.id && !fine.paidDate) out.push(fineDeadline(vehicle, fine, today));
  }

  return out.sort(compareDeadlines(today));
}

export function allDeadlines(vehicles: Vehicle[], today: ISODate, related: RelatedRecords = {}): Deadline[] {
  return vehicles.flatMap((v) => computeDeadlines(v, today, related)).sort(compareDeadlines(today));
}

/**
 * Araca ait işin tamamlandığını araca işler; sonraki son tarih buradan türetilir.
 * Parça ve ceza kayıtları kendi kayıtlarında güncellenir (bkz. store).
 */
export function applyCompletion(vehicle: Vehicle, deadline: Deadline, doneDate: ISODate): Vehicle {
  switch (deadline.kind) {
    // TÜVTÜRK: erken yapılan muayenede yeni süre eski bitişten değil, muayene gününden başlar.
    case 'muayene':
      return { ...vehicle, inspectionDue: addYears(doneDate, INSPECTION_PERIOD_YEARS[vehicle.kind].then) };
    // Erken yenilenen poliçe eskisinin bitişinden, süresi geçmiş olan yenileme gününden başlar.
    case 'trafik':
      return { ...vehicle, trafficInsuranceDue: addYears(maxISO(deadline.due ?? doneDate, doneDate), INSURANCE_TERM_YEARS) };
    case 'kasko':
      return { ...vehicle, kaskoDue: addYears(maxISO(deadline.due ?? doneDate, doneDate), INSURANCE_TERM_YEARS) };
    case 'mtv':
      return { ...vehicle, mtvPaid: [...vehicle.mtvPaid, deadline.key] };
    case 'kisLastigi':
    case 'yazLastigi':
      return { ...vehicle, tireDone: [...vehicle.tireDone, deadline.key] };
    case 'bakim':
      return { ...vehicle, lastServiceDate: doneDate };
    case 'parca':
    case 'ceza':
      return vehicle;
  }
}

/**
 * Sıfır araç için ilk tescilden muayene tarihi tahmini. Muayenelerin
 * zamanında yapıldığını varsayar; kesin tarih ruhsattadır.
 */
export function estimateInspectionDue(registrationDate: ISODate, kind: VehicleKind, today: ISODate): ISODate {
  const { first, then } = INSPECTION_PERIOD_YEARS[kind];
  let years = first;
  let due = addYears(registrationDate, years);
  while (due < today) {
    years += then;
    due = addYears(registrationDate, years);
  }
  return due;
}
