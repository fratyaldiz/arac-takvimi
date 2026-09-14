import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Icon, type IconName } from './src/components/Icon';
import { useToday } from './src/hooks/useToday';
import type { RootStackParamList, TabParamList } from './src/navigation';
import { syncNotifications } from './src/notifications/scheduler';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { ExpenseFormScreen } from './src/screens/ExpenseFormScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { FineFormScreen } from './src/screens/FineFormScreen';
import { GarageScreen } from './src/screens/GarageScreen';
import { ParkingScreen } from './src/screens/ParkingScreen';
import { PartFormScreen } from './src/screens/PartFormScreen';
import { RoadScreen } from './src/screens/RoadScreen';
import { TripScreen } from './src/screens/TripScreen';
import { VehicleDetailScreen } from './src/screens/VehicleDetailScreen';
import { VehicleFormScreen } from './src/screens/VehicleFormScreen';
import { useFuelPrices } from './src/store/fuel';
import { useGarage, useHydrated } from './src/store/garage';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, [IconName, IconName]> = {
  Takvim: ['calendar-check', 'calendar-check-outline'],
  Masraflar: ['wallet', 'wallet-outline'],
  Garaj: ['garage-variant', 'garage'],
  Yolda: ['map-marker-radius', 'map-marker-radius-outline'],
};

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    primary: colors.primary,
    text: colors.text,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => (
          <Icon name={TAB_ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Takvim" component={CalendarScreen} />
      <Tab.Screen name="Masraflar" component={ExpensesScreen} />
      <Tab.Screen name="Garaj" component={GarageScreen} />
      <Tab.Screen name="Yolda" component={RoadScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const hydrated = useHydrated();
  const vehicles = useGarage((s) => s.vehicles);
  const parts = useGarage((s) => s.parts);
  const fines = useGarage((s) => s.fines);
  const parking = useGarage((s) => s.parking);
  const today = useToday();

  // Veri değişince ve her gün ilk açılışta bildirim planı yeniden kurulur.
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => syncNotifications({ vehicles, parts, fines, parking }), 800);
    return () => clearTimeout(timer);
  }, [hydrated, vehicles, parts, fines, parking, today]);

  useEffect(() => {
    useFuelPrices.getState().refresh();
  }, [today]);

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.text, fontWeight: '700' },
            headerBackTitle: 'Geri',
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="VehicleForm" component={VehicleFormScreen} options={{ title: 'Araç' }} />
          <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: '' }} />
          <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} options={{ title: 'Masraf' }} />
          <Stack.Screen name="PartForm" component={PartFormScreen} options={{ title: 'Parça ve bakım' }} />
          <Stack.Screen name="FineForm" component={FineFormScreen} options={{ title: 'Trafik cezası' }} />
          <Stack.Screen name="Trip" component={TripScreen} options={{ title: 'Yolculuk maliyeti' }} />
          <Stack.Screen name="Parking" component={ParkingScreen} options={{ title: 'Park ettim' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
