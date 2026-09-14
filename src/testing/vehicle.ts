import type { PartItem, TrafficFine, Vehicle } from '../types';

export function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v1',
    plate: '34 ABC 123',
    name: '',
    kind: 'hususi',
    fuelType: 'benzin',
    color: 'mavi',
    odometerKm: null,
    inspectionDue: null,
    trafficInsuranceDue: null,
    kaskoDue: null,
    mtvEnabled: false,
    mtvPaid: [],
    tireEnabled: false,
    tireDone: [],
    lastServiceDate: null,
    serviceIntervalMonths: 12,
    createdAt: '2026-09-14',
    ...overrides,
  };
}

export function makePart(overrides: Partial<PartItem> = {}): PartItem {
  return {
    id: 'p1',
    vehicleId: 'v1',
    kind: 'yag',
    label: 'Motor yağı ve filtresi',
    intervalKm: 10000,
    intervalMonths: 12,
    lastKm: 80000,
    lastDate: '2026-03-01',
    ...overrides,
  };
}

export function makeFine(overrides: Partial<TrafficFine> = {}): TrafficFine {
  return {
    id: 'f1',
    vehicleId: 'v1',
    noticeDate: '2026-09-01',
    amount: 2000,
    reason: 'Hız',
    paidDate: null,
    paidAmount: null,
    ...overrides,
  };
}
