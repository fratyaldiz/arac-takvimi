import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { applyCompletion, finePayableAmount } from '../rules/schedule';
import type { Deadline, Expense, ParkingSession, PartItem, TrafficFine, Vehicle } from '../types';
import { todayISO, type ISODate } from '../utils/date';
import { GARAGE_STORE_VERSION, migrateGarage } from './migrate';

export type VehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'mtvPaid' | 'tireDone'>;
export type ExpenseInput = Omit<Expense, 'id'>;
export type PartInput = Omit<PartItem, 'id'>;
export type FineInput = Omit<TrafficFine, 'id' | 'paidDate' | 'paidAmount'>;

export interface GarageData {
  vehicles: Vehicle[];
  expenses: Expense[];
  parts: PartItem[];
  fines: TrafficFine[];
  parking: ParkingSession | null;
}

interface GarageState extends GarageData {
  addVehicle: (input: VehicleInput) => string;
  updateVehicle: (id: string, patch: Partial<VehicleInput>) => void;
  /** Kullanıcının girdiği km; yanlış girişi düzeltmek için düşürmeye de izin verir. */
  setOdometer: (id: string, km: number) => void;
  removeVehicle: (id: string) => void;
  completeDeadline: (deadline: Deadline, doneDate: ISODate) => void;

  addExpense: (input: ExpenseInput) => string;
  updateExpense: (id: string, input: ExpenseInput) => void;
  removeExpense: (id: string) => void;

  addPart: (input: PartInput) => string;
  updatePart: (id: string, patch: Partial<PartInput>) => void;
  removePart: (id: string) => void;
  /** Parçayı yapıldı işaretler; tutar girilirse masraf olarak da kaydeder. */
  completePart: (id: string, doneDate: ISODate, km: number | null, cost: number | null) => void;

  addFine: (input: FineInput) => string;
  removeFine: (id: string) => void;
  /** Cezayı ödendi işaretler ve ödenen tutarı masraf olarak kaydeder. */
  payFine: (id: string, paidDate: ISODate, amount: number) => void;

  startParking: (session: ParkingSession) => void;
  endParking: () => void;
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Plakalarda noktalı İ yok; Türkçe klavyeden gelen "i" de "I" olmalı. */
export function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/İ/g, 'I').replace(/\s+/g, ' ').trim();
}

/** Yeni km okuması eskisinden büyükse aracın km'sini ilerletir. */
function withOdometer(vehicles: Vehicle[], vehicleId: string, km: number | null): Vehicle[] {
  if (km === null) return vehicles;
  return vehicles.map((v) => (v.id === vehicleId && (v.odometerKm === null || km > v.odometerKm) ? { ...v, odometerKm: km } : v));
}

export const useGarage = create<GarageState>()(
  persist(
    (set) => ({
      vehicles: [],
      expenses: [],
      parts: [],
      fines: [],
      parking: null,

      addVehicle: (input) => {
        const id = newId();
        const vehicle: Vehicle = { ...input, id, createdAt: todayISO(), mtvPaid: [], tireDone: [] };
        set((s) => ({ vehicles: [...s.vehicles, vehicle] }));
        return id;
      },
      updateVehicle: (id, patch) =>
        set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
      setOdometer: (id, km) =>
        set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, odometerKm: km } : v)) })),
      removeVehicle: (id) =>
        set((s) => ({
          vehicles: s.vehicles.filter((v) => v.id !== id),
          expenses: s.expenses.filter((e) => e.vehicleId !== id),
          parts: s.parts.filter((p) => p.vehicleId !== id),
          fines: s.fines.filter((f) => f.vehicleId !== id),
          parking: s.parking?.vehicleId === id ? null : s.parking,
        })),
      completeDeadline: (deadline, doneDate) =>
        set((s) => ({
          vehicles: s.vehicles.map((v) => (v.id === deadline.vehicleId ? applyCompletion(v, deadline, doneDate) : v)),
        })),

      addExpense: (input) => {
        const id = newId();
        set((s) => ({
          expenses: [...s.expenses, { ...input, id }],
          vehicles: withOdometer(s.vehicles, input.vehicleId, input.odometerKm),
        }));
        return id;
      },
      updateExpense: (id, input) =>
        set((s) => ({
          expenses: s.expenses.map((e) => (e.id === id ? { ...input, id } : e)),
          vehicles: withOdometer(s.vehicles, input.vehicleId, input.odometerKm),
        })),
      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addPart: (input) => {
        const id = newId();
        set((s) => ({
          parts: [...s.parts, { ...input, id }],
          vehicles: withOdometer(s.vehicles, input.vehicleId, input.lastKm),
        }));
        return id;
      },
      updatePart: (id, patch) => set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removePart: (id) => set((s) => ({ parts: s.parts.filter((p) => p.id !== id) })),
      completePart: (id, doneDate, km, cost) =>
        set((s) => {
          const part = s.parts.find((p) => p.id === id);
          if (!part) return s;
          const vehicle = s.vehicles.find((v) => v.id === part.vehicleId);
          const lastKm = km ?? vehicle?.odometerKm ?? null;
          const expenses: Expense[] =
            cost && cost > 0
              ? [
                  ...s.expenses,
                  {
                    id: newId(),
                    vehicleId: part.vehicleId,
                    date: doneDate,
                    category: part.kind === 'lastik' ? 'lastik' : 'bakim',
                    amount: cost,
                    note: part.label,
                    odometerKm: km,
                    fuel: null,
                  },
                ]
              : s.expenses;
          return {
            parts: s.parts.map((p) => (p.id === id ? { ...p, lastDate: doneDate, lastKm } : p)),
            expenses,
            vehicles: withOdometer(s.vehicles, part.vehicleId, km),
          };
        }),

      addFine: (input) => {
        const id = newId();
        set((s) => ({ fines: [...s.fines, { ...input, id, paidDate: null, paidAmount: null }] }));
        return id;
      },
      removeFine: (id) => set((s) => ({ fines: s.fines.filter((f) => f.id !== id) })),
      payFine: (id, paidDate, amount) =>
        set((s) => {
          const fine = s.fines.find((f) => f.id === id);
          if (!fine) return s;
          return {
            fines: s.fines.map((f) => (f.id === id ? { ...f, paidDate, paidAmount: amount } : f)),
            expenses: [
              ...s.expenses,
              {
                id: newId(),
                vehicleId: fine.vehicleId,
                date: paidDate,
                category: 'ceza',
                amount,
                note: fine.reason || 'Trafik cezası',
                odometerKm: null,
                fuel: null,
              },
            ],
          };
        }),

      startParking: (session) => set({ parking: session }),
      endParking: () => set({ parking: null }),
    }),
    {
      name: 'arac-takvimi',
      version: GARAGE_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ vehicles, expenses, parts, fines, parking }): GarageData => ({ vehicles, expenses, parts, fines, parking }),
      migrate: migrateGarage,
    },
  ),
);

export { finePayableAmount };

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(useGarage.persist.hasHydrated());
  useEffect(() => {
    const unsubscribe = useGarage.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useGarage.persist.hasHydrated());
    return unsubscribe;
  }, []);
  return hydrated;
}
