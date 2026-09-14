import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { ChipRow, TextField } from '../components/ui';
import { useStatusBar } from '../hooks/useStatusBar';
import type { ScreenProps } from '../navigation';
import { ensureNotificationPermission } from '../notifications/scheduler';
import { useGarage } from '../store/garage';
import { colors, radius, shadow } from '../theme';

const DURATIONS = [
  { value: 0, label: 'Süresiz' },
  { value: 30, label: '30 dk' },
  { value: 60, label: '1 saat' },
  { value: 120, label: '2 saat' },
  { value: 180, label: '3 saat' },
  { value: 240, label: '4 saat' },
];

async function currentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Konum izni verilmedi', 'Park yeri kaydedilmeden devam edildi.');
    return null;
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

export function ParkingScreen({ navigation }: ScreenProps<'Parking'>) {
  useStatusBar('dark');
  const vehicles = useGarage((s) => s.vehicles);
  const startParking = useGarage((s) => s.startParking);
  const insets = useSafeAreaInsets();

  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '');
  const [minutes, setMinutes] = useState(60);
  const [note, setNote] = useState('');
  const [saveLocation, setSaveLocation] = useState(true);
  const [saving, setSaving] = useState(false);

  const start = async () => {
    setSaving(true);
    let position: { latitude: number; longitude: number } | null = null;
    if (saveLocation) {
      try {
        position = await currentPosition();
      } catch {
        Alert.alert('Konum alınamadı', 'Park yeri kaydedilmeden devam edildi.');
      }
    }
    const startedAt = new Date();
    const endsAt = minutes ? new Date(startedAt.getTime() + minutes * 60_000).toISOString() : null;
    startParking({
      vehicleId: vehicleId || null,
      startedAt: startedAt.toISOString(),
      endsAt,
      latitude: position?.latitude ?? null,
      longitude: position?.longitude ?? null,
      note: note.trim(),
    });
    if (endsAt) ensureNotificationPermission().catch(() => {});
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}>
        {vehicles.length > 1 ? (
          <ChipRow options={vehicles.map((v) => ({ value: v.id, label: v.plate }))} value={vehicleId} onChange={setVehicleId} />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Park süresi</Text>
          <ChipRow options={DURATIONS} value={minutes} onChange={setMinutes} />
          <Text style={styles.hint}>Süre dolmadan 10 dakika önce ve dolduğunda bildirim gelir.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={styles.label}>Konumu kaydet</Text>
              <Text style={styles.hint}>Dönüşte aracını haritada bulursun.</Text>
            </View>
            <Switch value={saveLocation} onValueChange={setSaveLocation} trackColor={{ true: colors.primary, false: colors.border }} />
          </View>
          <TextField label="Not" optional value={note} onChangeText={setNote} placeholder="Örn. B2 katı, 14 numara" autoCapitalize="sentences" />
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button title={saving ? 'Konum alınıyor...' : 'Park ettim'} icon="parking" onPress={start} disabled={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    gap: 12,
    ...shadow,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.bg,
  },
});
