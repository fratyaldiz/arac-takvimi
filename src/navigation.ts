import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ExpenseCategory } from './types';

export type TabParamList = {
  Takvim: undefined;
  Masraflar: undefined;
  Garaj: undefined;
  Yolda: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  VehicleForm: { id?: string };
  VehicleDetail: { id: string };
  ExpenseForm: { id?: string; vehicleId?: string; category?: ExpenseCategory };
  PartForm: { vehicleId: string; id?: string };
  FineForm: { vehicleId?: string };
  Trip: undefined;
  Parking: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type TabProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
