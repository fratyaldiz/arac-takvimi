import { useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { DateField } from '../components/DatePicker';
import { ListRow, TextField } from '../components/ui';
import { useStatusBar } from '../hooks/useStatusBar';
import type { ScreenProps } from '../navigation';
import { presetsFor, type PartPreset } from '../rules/parts';
import { intervalText } from '../rules/schedule';
import { useGarage, type PartInput } from '../store/garage';
import { colors, PART_ICON, radius, shadow } from '../theme';
import type { PartKind } from '../types';
import type { ISODate } from '../utils/date';
import { parseDecimalTR } from '../utils/money';

function parseOptionalInt(text: string): number | null | 'invalid' {
  if (!text.trim()) return null;
  const value = parseDecimalTR(text);
  if (value === null || value <= 0) return 'invalid';
  return Math.round(value);
}

export function PartFormScreen({ navigation, route }: ScreenProps<'PartForm'>) {
  useStatusBar('dark');
  const { vehicleId, id } = route.params;
  const vehicle = useGarage((s) => s.vehicles.find((v) => v.id === vehicleId));
  const existing = useGarage((s) => (id ? s.parts.find((p) => p.id === id) : undefined));
  const allParts = useGarage((s) => s.parts);
  const addPart = useGarage((s) => s.addPart);
  const updatePart = useGarage((s) => s.updatePart);
  const removePart = useGarage((s) => s.removePart);
  const insets = useSafeAreaInsets();

  const [picked, setPicked] = useState(Boolean(existing));
  const [kind, setKind] = useState<PartKind>(existing?.kind ?? 'ozel');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [kmText, setKmText] = useState(existing?.intervalKm != null ? String(existing.intervalKm) : '');
  const [monthsText, setMonthsText] = useState(existing?.intervalMonths != null ? String(existing.intervalMonths) : '');
  const [lastDate, setLastDate] = useState<ISODate | null>(existing?.lastDate ?? null);
  const [lastKmText, setLastKmText] = useState(existing?.lastKm != null ? String(existing.lastKm) : '');

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? 'Kalemi düzenle' : 'Parça ve bakım' });
  }, [navigation, existing]);

  if (!vehicle) return null;

  const choose = (preset?: PartPreset) => {
    setKind(preset?.kind ?? 'ozel');
    setLabel(preset?.label ?? '');
    setKmText(preset?.intervalKm ? String(preset.intervalKm) : '');
    setMonthsText(preset?.intervalMonths ? String(preset.intervalMonths) : '');
    setPicked(true);
  };

  if (!picked) {
    const added = new Set(allParts.filter((p) => p.vehicleId === vehicleId).map((p) => p.kind));
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.intro}>Hangi kalemi takip etmek istiyorsun?</Text>
        {presetsFor(vehicle.fuelType).map((p) => (
          <ListRow
            key={p.kind}
            icon={PART_ICON[p.kind]}
            iconColor="#9333EA"
            iconBg="#F3E8FF"
            title={p.label}
            subtitle={added.has(p.kind) ? 'Zaten ekli' : intervalText(p.intervalKm, p.intervalMonths)}
            onPress={added.has(p.kind) ? undefined : () => choose(p)}
          />
        ))}
        <ListRow icon="plus" iconColor={colors.primary} iconBg={colors.primarySoft} title="Özel kalem" subtitle="Listede olmayan bir şey" onPress={() => choose()} />
        <Text style={styles.note}>Önerilen aralıklar geneldir; aracının bakım kılavuzundaki değerler esastır.</Text>
      </ScrollView>
    );
  }

  const save = () => {
    if (!label.trim()) {
      Alert.alert('Ad gerekli', 'Kalemin adını yaz.');
      return;
    }
    const intervalKm = parseOptionalInt(kmText);
    const intervalMonths = parseOptionalInt(monthsText);
    const lastKm = parseOptionalInt(lastKmText);
    if (intervalKm === 'invalid' || intervalMonths === 'invalid' || lastKm === 'invalid') {
      Alert.alert('Geçersiz sayı', 'Km ve ay alanlarına rakam yaz.');
      return;
    }
    if (intervalKm === null && intervalMonths === null) {
      Alert.alert('Aralık gerekli', 'Km ya da ay olarak en az bir değişim aralığı gir.');
      return;
    }
    const input: PartInput = { vehicleId, kind, label: label.trim(), intervalKm, intervalMonths, lastDate, lastKm };
    if (existing) updatePart(existing.id, input);
    else addPart(input);
    navigation.goBack();
  };

  const confirmDelete = () =>
    Alert.alert('Kalemi sil', `${label} takibi silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          if (existing) removePart(existing.id);
          navigation.goBack();
        },
      },
    ]);

  return (
    <View style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}>
        <View style={styles.card}>
          <TextField label="Kalem adı" value={label} onChangeText={setLabel} placeholder="Örn. Motor yağı" autoCapitalize="sentences" />
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField label="Her" value={kmText} onChangeText={setKmText} keyboardType="number-pad" suffix="km" placeholder="10000" />
            </View>
            <View style={styles.flex}>
              <TextField label="ya da her" value={monthsText} onChangeText={setMonthsText} keyboardType="number-pad" suffix="ay" placeholder="12" />
            </View>
          </View>
          <Text style={styles.note}>Hangisi önce dolarsa o hatırlatılır. Değerler genel öneridir; kılavuzuna göre düzenle.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Son değişim</Text>
          <DateField label="Tarih" value={lastDate} onChange={setLastDate} optional />
          <TextField
            label="Kilometre"
            optional
            value={lastKmText}
            onChangeText={setLastKmText}
            keyboardType="number-pad"
            suffix="km"
            placeholder={vehicle.odometerKm != null ? String(vehicle.odometerKm) : 'Örn. 80000'}
          />
          <Text style={styles.note}>Bilmiyorsan boş bırak; bir sonraki değişimde "Yaptırdım" ile işaretlersin.</Text>
        </View>

        {existing ? <Button variant="danger" icon="delete-outline" title="Kalemi sil" onPress={confirmDelete} /> : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button title="Kaydet" icon="check" onPress={save} />
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
  intro: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  note: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    gap: 14,
    ...shadow,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
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
