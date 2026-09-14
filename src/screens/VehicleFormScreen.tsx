import { LinearGradient } from 'expo-linear-gradient';
import { useLayoutEffect, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { DateField, useDatePicker } from '../components/DatePicker';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/Segmented';
import { TextField } from '../components/ui';
import { useStatusBar } from '../hooks/useStatusBar';
import { useToday } from '../hooks/useToday';
import type { ScreenProps } from '../navigation';
import { ensureNotificationPermission, syncNotifications } from '../notifications/scheduler';
import {
  DEFAULT_SERVICE_INTERVAL_MONTHS,
  INSPECTION_PERIOD_YEARS,
  SERVICE_INTERVAL_OPTIONS,
  WINTER_TIRE,
} from '../rules/regulations';
import { estimateInspectionDue } from '../rules/schedule';
import { normalizePlate, useGarage, type VehicleInput } from '../store/garage';
import { colors, FUEL_LABEL, KIND_LABEL, radius, shadow, VEHICLE_GRADIENTS } from '../theme';
import { VEHICLE_COLOR_KEYS, type FuelType, type VehicleColor, type VehicleKind } from '../types';
import { formatDayMonthTR, type ISODate } from '../utils/date';
import { parseDecimalTR } from '../utils/money';

const KIND_OPTIONS: { value: VehicleKind; label: string }[] = [
  { value: 'hususi', label: 'Hususi' },
  { value: 'ticari', label: 'Ticari' },
  { value: 'motosiklet', label: 'Motosiklet' },
];

const FUEL_OPTIONS = (['benzin', 'motorin', 'lpg'] as FuelType[]).map((value) => ({ value, label: FUEL_LABEL[value] }));

const SERVICE_OPTIONS = SERVICE_INTERVAL_OPTIONS.map((months) => ({ value: months, label: `${months} ay` }));

function inspectionRule(kind: VehicleKind): string {
  const { first, then } = INSPECTION_PERIOD_YEARS[kind];
  return `${KIND_LABEL[kind]}: ilk muayene ${first}. yılda, sonra ${then === 1 ? 'her yıl' : `${then} yılda bir`}.`;
}

export function VehicleFormScreen({ navigation, route }: ScreenProps<'VehicleForm'>) {
  useStatusBar('dark');
  const editingId = route.params?.id;
  const existing = useGarage((s) => (editingId ? s.vehicles.find((v) => v.id === editingId) : undefined));
  const vehicleCount = useGarage((s) => s.vehicles.length);
  const addVehicle = useGarage((s) => s.addVehicle);
  const updateVehicle = useGarage((s) => s.updateVehicle);
  const today = useToday();
  const insets = useSafeAreaInsets();
  const picker = useDatePicker();

  const [plate, setPlate] = useState(existing?.plate ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [kind, setKind] = useState<VehicleKind>(existing?.kind ?? 'hususi');
  const [fuelType, setFuelType] = useState<FuelType>(existing?.fuelType ?? 'benzin');
  const [color, setColor] = useState<VehicleColor>(
    existing?.color ?? VEHICLE_COLOR_KEYS[vehicleCount % VEHICLE_COLOR_KEYS.length],
  );
  const [odometerText, setOdometerText] = useState(existing?.odometerKm != null ? String(existing.odometerKm) : '');
  const [inspectionDue, setInspectionDue] = useState<ISODate | null>(existing?.inspectionDue ?? null);
  /** Muayene tarihi tescilden tahmin edildiyse tescil tarihi; tür değişince tahmin yenilenir. */
  const [registration, setRegistration] = useState<ISODate | null>(null);
  const [trafficInsuranceDue, setTrafficInsuranceDue] = useState<ISODate | null>(existing?.trafficInsuranceDue ?? null);
  const [kaskoDue, setKaskoDue] = useState<ISODate | null>(existing?.kaskoDue ?? null);
  const [lastServiceDate, setLastServiceDate] = useState<ISODate | null>(existing?.lastServiceDate ?? null);
  const [serviceIntervalMonths, setServiceIntervalMonths] = useState(
    existing?.serviceIntervalMonths ?? DEFAULT_SERVICE_INTERVAL_MONTHS,
  );
  const [mtvEnabled, setMtvEnabled] = useState(existing?.mtvEnabled ?? true);
  const [tireEnabled, setTireEnabled] = useState(existing?.tireEnabled ?? false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? 'Aracı düzenle' : 'Yeni araç' });
  }, [navigation, existing]);

  const changeKind = (next: VehicleKind) => {
    setKind(next);
    if (!existing) setTireEnabled(next === 'ticari');
    if (registration) setInspectionDue(estimateInspectionDue(registration, next, today));
  };

  const estimate = async () => {
    const date = await picker.open(null, { title: 'İlk tescil tarihi', max: today });
    if (!date) return;
    setRegistration(date);
    setInspectionDue(estimateInspectionDue(date, kind, today));
  };

  const save = () => {
    const normalized = normalizePlate(plate);
    if (!normalized) {
      Alert.alert('Plaka gerekli', 'Aracı ayırt edebilmek için plakayı gir.');
      return;
    }
    const odometer = odometerText.trim() ? parseDecimalTR(odometerText) : null;
    if (odometerText.trim() && (odometer === null || odometer < 0)) {
      Alert.alert('Geçersiz km', 'Kilometreyi rakamla yaz.');
      return;
    }
    const input: VehicleInput = {
      plate: normalized,
      name: name.trim(),
      kind,
      fuelType,
      color,
      odometerKm: odometer !== null ? Math.round(odometer) : null,
      inspectionDue,
      trafficInsuranceDue,
      kaskoDue,
      mtvEnabled,
      tireEnabled,
      lastServiceDate,
      serviceIntervalMonths,
    };
    if (existing) {
      updateVehicle(existing.id, input);
      navigation.goBack();
    } else {
      const id = addVehicle(input);
      navigation.replace('VehicleDetail', { id });
    }
    // İzin, kullanıcı ilk aracını kaydedince istenir; verilirse plan hemen kurulur.
    ensureNotificationPermission()
      .then((granted) => {
        if (granted) syncNotifications(useGarage.getState());
      })
      .catch(() => {});
  };

  const tireRange = `Kış lastiği ${formatDayMonthTR(WINTER_TIRE.start.month, WINTER_TIRE.start.day)}, yaz lastiği ${formatDayMonthTR(WINTER_TIRE.end.month, WINTER_TIRE.end.day)}`;

  return (
    <View style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}>
        <LinearGradient colors={VEHICLE_GRADIENTS[color]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}>
          <Icon name={kind === 'motosiklet' ? 'motorbike' : 'car-side'} size={40} color="#FFFFFF" />
          <View style={styles.flex}>
            <Text style={styles.previewPlate}>{normalizePlate(plate) || 'Plaka'}</Text>
            <Text style={styles.previewName}>{name.trim() || KIND_LABEL[kind]}</Text>
          </View>
        </LinearGradient>

        <Card title="Araç">
          <Field label="Plaka">
            <TextInput
              value={plate}
              onChangeText={setPlate}
              placeholder="34 ABC 123"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
            />
          </Field>
          <Field label="Model ya da takma ad" optional>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Örn. Egea, iş arabası"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </Field>
          <Field label="Tür">
            <Segmented options={KIND_OPTIONS} value={kind} onChange={changeKind} />
          </Field>
          <Field label="Yakıt">
            <Segmented options={FUEL_OPTIONS} value={fuelType} onChange={setFuelType} />
          </Field>
          <Field label="Renk">
            <View style={styles.swatches}>
              {VEHICLE_COLOR_KEYS.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => setColor(key)}
                  style={[styles.swatchWrap, color === key && { borderColor: VEHICLE_GRADIENTS[key][0] }]}
                  accessibilityLabel={key}
                >
                  <LinearGradient colors={VEHICLE_GRADIENTS[key]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.swatch} />
                </Pressable>
              ))}
            </View>
          </Field>
          <TextField
            label="Güncel kilometre"
            optional
            value={odometerText}
            onChangeText={setOdometerText}
            keyboardType="number-pad"
            suffix="km"
            placeholder="Örn. 85000"
            hint="Km'ye bağlı bakımlar (yağ, balata...) buna göre hesaplanır."
          />
        </Card>

        <Card title="Muayene" note={inspectionRule(kind)}>
          <DateField
            label="Muayene geçerlilik tarihi"
            value={inspectionDue}
            onChange={(value) => {
              setInspectionDue(value);
              setRegistration(null);
            }}
            hint={
              registration
                ? 'Tescil tarihinden tahmin edildi. Kesin tarih ruhsatta yazar, kontrol etmeni öneririz.'
                : 'Ruhsatta "muayene geçerlilik tarihi" olarak yazar. TÜVTÜRK sitesinden de sorgulanabilir.'
            }
          />
          <Pressable onPress={estimate} hitSlop={6}>
            <Text style={styles.link}>Bilmiyorum, tescil tarihinden hesapla</Text>
          </Pressable>
        </Card>

        <Card title="Sigorta">
          <DateField
            label="Trafik sigortası bitiş tarihi"
            value={trafficInsuranceDue}
            onChange={setTrafficInsuranceDue}
            hint="Poliçede bitiş tarihi olarak yazar."
          />
          <DateField label="Kasko bitiş tarihi" value={kaskoDue} onChange={setKaskoDue} optional />
        </Card>

        <Card title="Periyodik bakım">
          <DateField label="Son bakım tarihi" value={lastServiceDate} onChange={setLastServiceDate} optional />
          <Field label="Bakım aralığı">
            <Segmented options={SERVICE_OPTIONS} value={serviceIntervalMonths} onChange={setServiceIntervalMonths} />
          </Field>
        </Card>

        <Card title="Diğer hatırlatmalar">
          <SwitchRow title="MTV taksitleri" subtitle="Ocak ve Temmuz, ay sonuna kadar" value={mtvEnabled} onChange={setMtvEnabled} />
          <SwitchRow
            title="Lastik değişimi"
            subtitle={`${tireRange}${kind === 'ticari' ? ' · ticari araçta zorunlu' : ''}`}
            value={tireEnabled}
            onChange={setTireEnabled}
          />
        </Card>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button title="Kaydet" icon="check" onPress={save} />
      </View>
      {picker.element}
    </View>
  );
}

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {note ? <Text style={styles.cardNote}>{note}</Text> : null}
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {optional ? <Text style={styles.optional}> (isteğe bağlı)</Text> : null}
      </Text>
      {children}
    </View>
  );
}

function SwitchRow({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.flex}>
        <Text style={styles.label}>{title}</Text>
        <Text style={styles.switchSubtitle}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} />
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
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    padding: 18,
  },
  previewPlate: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  previewName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    gap: 6,
    ...shadow,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  cardNote: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  cardBody: {
    gap: 16,
    marginTop: 8,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  optional: {
    fontWeight: '400',
    color: colors.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchWrap: {
    borderWidth: 3,
    borderColor: 'transparent',
    borderRadius: 22,
    padding: 2,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  link: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchSubtitle: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
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
