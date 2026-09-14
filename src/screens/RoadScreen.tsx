import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { FuelPriceTiles } from '../components/FuelPriceTiles';
import { Icon } from '../components/Icon';
import { useSheet } from '../components/Sheet';
import { GradientHero, ListRow, SectionHeader, screenStyles } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useStatusBar } from '../hooks/useStatusBar';
import { useToday } from '../hooks/useToday';
import type { TabProps } from '../navigation';
import { FINE_DISCOUNT_PERCENT } from '../rules/regulations';
import { fineDiscountDeadline, finePayableAmount } from '../rules/schedule';
import { useGarage } from '../store/garage';
import { colors } from '../theme';
import type { ParkingSession } from '../types';
import { formatTR } from '../utils/date';
import { formatTL } from '../utils/money';
import { openPayFine } from './actions';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function timeHM(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function remainingText(endsAt: string, now: Date): string {
  const ms = Date.parse(endsAt) - now.getTime();
  if (ms <= 0) return 'Süre doldu';
  const minutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} sa ${minutes % 60} dk kaldı` : `${minutes} dk kaldı`;
}

function openMap(latitude: number, longitude: number) {
  const label = encodeURIComponent('Aracım');
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
  Linking.openURL(url).catch(() => Alert.alert('Harita açılamadı'));
}

export function RoadScreen({ navigation }: TabProps<'Yolda'>) {
  useStatusBar('light');
  const vehicles = useGarage((s) => s.vehicles);
  const fines = useGarage((s) => s.fines);
  const parking = useGarage((s) => s.parking);
  const endParking = useGarage((s) => s.endParking);
  const payFine = useGarage((s) => s.payFine);
  const sheet = useSheet();
  const today = useToday();
  const now = useNow(15_000, parking !== null);

  const unpaid = fines.filter((f) => !f.paidDate).sort((a, b) => (a.noticeDate < b.noticeDate ? -1 : 1));
  const plateOf = (id: string | null) => (id ? vehicles.find((v) => v.id === id)?.plate : undefined);

  return (
    <View style={styles.flex}>
      <ScrollView style={screenStyles.scroll} contentContainerStyle={styles.bottom}>
        <GradientHero colors={['#EA580C', '#F59E0B']}>
          <Text style={screenStyles.heroSubtitle}>Yakıt, otopark, yolculuk ve cezalar</Text>
          <Text style={screenStyles.heroTitle}>Yolda</Text>
        </GradientHero>

        <View style={screenStyles.content}>
          <SectionHeader title="Akaryakıt fiyatları" />
          <FuelPriceTiles />

          <SectionHeader title="Otopark" />
          {parking ? (
            <ParkingCard parking={parking} plate={plateOf(parking.vehicleId)} now={now} onEnd={endParking} />
          ) : (
            <ListRow
              icon="parking"
              iconColor="#0891B2"
              iconBg="#CFFAFE"
              title="Park ettim"
              subtitle="Yerini ve süresini kaydet, süre dolmadan haber verelim."
              onPress={() => navigation.navigate('Parking')}
            />
          )}

          <SectionHeader title="Yolculuk" />
          <ListRow
            icon="map-marker-distance"
            iconColor="#7C3AED"
            iconBg="#EDE9FE"
            title="Yolculuk maliyeti"
            subtitle="Mesafe, tüketim ve kişi sayısına göre yakıt masrafını hesapla."
            onPress={() => navigation.navigate('Trip')}
          />

          <SectionHeader
            title="Trafik cezaları"
            action={vehicles.length ? { label: 'Ekle', onPress: () => navigation.navigate('FineForm', {}) } : undefined}
          />
          {unpaid.length === 0 ? (
            <Text style={styles.muted}>
              Ödenmemiş ceza yok. Ceza gelirse ekle; %{FINE_DISCOUNT_PERCENT} indirim süresi bitmeden hatırlatalım.
            </Text>
          ) : (
            unpaid.map((f) => {
              const deadline = fineDiscountDeadline(f);
              const discounted = today <= deadline;
              const detail = discounted
                ? `${formatTR(deadline)} tarihine kadar ${formatTL(finePayableAmount(f, today))}`
                : `İndirim süresi geçti · ${formatTL(f.amount)}`;
              return (
                <ListRow
                  key={f.id}
                  icon="alert-octagon-outline"
                  iconColor={colors.danger}
                  iconBg={colors.dangerSoft}
                  title={f.reason ? `Ceza: ${f.reason}` : 'Trafik cezası'}
                  subtitle={[plateOf(f.vehicleId), detail].filter(Boolean).join(' · ')}
                  right={<Button small title="Ödedim" onPress={() => openPayFine(sheet.open, f, payFine)} />}
                />
              );
            })
          )}
        </View>
      </ScrollView>
      {sheet.element}
    </View>
  );
}

function ParkingCard({
  parking,
  plate,
  now,
  onEnd,
}: {
  parking: ParkingSession;
  plate: string | undefined;
  now: Date;
  onEnd: () => void;
}) {
  const expired = parking.endsAt !== null && Date.parse(parking.endsAt) <= now.getTime();
  const { latitude, longitude } = parking;
  return (
    <LinearGradient
      colors={expired ? ['#DC2626', '#F87171'] : ['#0891B2', '#22D3EE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.parking}
    >
      <View style={styles.parkingTop}>
        <Icon name="parking" size={30} color="#FFFFFF" />
        <View style={styles.flex}>
          <Text style={styles.parkingTitle}>{plate ?? 'Park halinde'}</Text>
          <Text style={styles.parkingSub}>
            {timeHM(parking.startedAt)} itibarıyla{parking.note ? ` · ${parking.note}` : ''}
          </Text>
        </View>
      </View>
      <Text style={styles.parkingBig}>{parking.endsAt ? remainingText(parking.endsAt, now) : 'Süre sınırı yok'}</Text>
      <View style={styles.parkingButtons}>
        {latitude !== null && longitude !== null ? (
          <View style={styles.flex}>
            <Button variant="light" small icon="map-marker" title="Haritada aç" onPress={() => openMap(latitude, longitude)} />
          </View>
        ) : null}
        <View style={styles.flex}>
          <Button variant="light" small icon="flag-checkered" title="Bitir" onPress={onEnd} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bottom: {
    paddingBottom: 32,
  },
  muted: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  parking: {
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  parkingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  parkingTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  parkingSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  parkingBig: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  parkingButtons: {
    flexDirection: 'row',
    gap: 10,
  },
});
