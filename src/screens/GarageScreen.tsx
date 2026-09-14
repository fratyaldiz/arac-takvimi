import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { deadlineBadge } from '../components/deadlineFormat';
import { Icon, type IconName } from '../components/Icon';
import { PlateBadge } from '../components/PlateBadge';
import { GradientHero, screenStyles } from '../components/ui';
import { sumBetween } from '../expenses/stats';
import { useStatusBar } from '../hooks/useStatusBar';
import { useToday } from '../hooks/useToday';
import type { TabProps } from '../navigation';
import { allDeadlines } from '../rules/schedule';
import { useGarage } from '../store/garage';
import { DEADLINE_META, FUEL_LABEL, KIND_LABEL, VEHICLE_GRADIENTS } from '../theme';
import type { Deadline, Vehicle } from '../types';
import type { ISODate } from '../utils/date';
import { formatKm, formatTL } from '../utils/money';

export function GarageScreen({ navigation }: TabProps<'Garaj'>) {
  useStatusBar('light');
  const vehicles = useGarage((s) => s.vehicles);
  const parts = useGarage((s) => s.parts);
  const fines = useGarage((s) => s.fines);
  const expenses = useGarage((s) => s.expenses);
  const today = useToday();
  const deadlines = useMemo(() => allDeadlines(vehicles, today, { parts, fines }), [vehicles, parts, fines, today]);
  const monthStart = `${today.slice(0, 7)}-01`;

  return (
    <ScrollView style={screenStyles.scroll} contentContainerStyle={styles.bottom}>
      <GradientHero colors={['#0F172A', '#475569']}>
        <Text style={screenStyles.heroSubtitle}>{vehicles.length ? `${vehicles.length} araç` : 'Henüz araç yok'}</Text>
        <Text style={screenStyles.heroTitle}>Garajım</Text>
      </GradientHero>
      <View style={screenStyles.content}>
        {vehicles.map((v) => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            next={deadlines.find((d) => d.vehicleId === v.id)}
            today={today}
            monthSpend={sumBetween(
              expenses.filter((e) => e.vehicleId === v.id),
              monthStart,
              today,
            )}
            onPress={() => navigation.navigate('VehicleDetail', { id: v.id })}
          />
        ))}
        <Button
          title="Araç ekle"
          icon="plus"
          variant={vehicles.length ? 'secondary' : 'primary'}
          onPress={() => navigation.navigate('VehicleForm', {})}
        />
      </View>
    </ScrollView>
  );
}

function VehicleCard({
  vehicle,
  next,
  today,
  monthSpend,
  onPress,
}: {
  vehicle: Vehicle;
  next: Deadline | undefined;
  today: ISODate;
  monthSpend: number;
  onPress: () => void;
}) {
  const meta = [vehicle.name ? KIND_LABEL[vehicle.kind] : null, FUEL_LABEL[vehicle.fuelType]].filter(Boolean).join(' · ');
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <LinearGradient colors={VEHICLE_GRADIENTS[vehicle.color]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.bgIcon} pointerEvents="none">
          <Icon name={vehicle.kind === 'motosiklet' ? 'motorbike' : 'car-side'} size={150} color="rgba(255,255,255,0.16)" />
        </View>
        <View style={styles.cardTop}>
          <PlateBadge plate={vehicle.plate} />
          <Icon name="chevron-right" size={26} color="#FFFFFF" />
        </View>
        <Text style={styles.name}>{vehicle.name || KIND_LABEL[vehicle.kind]}</Text>
        <Text style={styles.meta}>{meta}</Text>
        <View style={styles.chips}>
          <InfoChip icon="speedometer" text={vehicle.odometerKm !== null ? formatKm(vehicle.odometerKm) : 'Km girilmedi'} />
          <InfoChip icon="wallet-outline" text={`Bu ay ${formatTL(monthSpend, 0)}`} />
          {next ? <InfoChip icon={DEADLINE_META[next.kind].icon} text={`${next.title} · ${deadlineBadge(next, today)}`} /> : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function InfoChip({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.infoChip}>
      <Icon name={icon} size={14} color="#FFFFFF" />
      <Text style={styles.infoText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: {
    paddingBottom: 32,
  },
  pressed: {
    opacity: 0.9,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    minHeight: 170,
    overflow: 'hidden',
    gap: 4,
  },
  bgIcon: {
    position: 'absolute',
    right: -14,
    bottom: -34,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  meta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
});
