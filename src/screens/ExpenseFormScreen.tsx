import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { DateField } from '../components/DatePicker';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/Segmented';
import { toInput } from '../components/Sheet';
import { ChipRow, TextField } from '../components/ui';
import { useStatusBar } from '../hooks/useStatusBar';
import { useToday } from '../hooks/useToday';
import type { ScreenProps } from '../navigation';
import { useFuelPrices } from '../store/fuel';
import { useGarage, type ExpenseInput } from '../store/garage';
import { colors, EXPENSE_META, FUEL_LABEL, radius, shadow } from '../theme';
import type { ExpenseCategory, FuelType } from '../types';
import { formatNumberTR, parseDecimalTR } from '../utils/money';

const CATEGORIES = Object.keys(EXPENSE_META) as ExpenseCategory[];
const FUEL_OPTIONS = (['benzin', 'motorin', 'lpg'] as FuelType[]).map((value) => ({ value, label: FUEL_LABEL[value] }));

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function ExpenseFormScreen({ navigation, route }: ScreenProps<'ExpenseForm'>) {
  useStatusBar('dark');
  const { id, vehicleId: paramVehicleId, category: paramCategory } = route.params ?? {};
  const vehicles = useGarage((s) => s.vehicles);
  const existing = useGarage((s) => (id ? s.expenses.find((e) => e.id === id) : undefined));
  const addExpense = useGarage((s) => s.addExpense);
  const updateExpense = useGarage((s) => s.updateExpense);
  const removeExpense = useGarage((s) => s.removeExpense);
  const prices = useFuelPrices((s) => s.data?.prices);
  const refreshPrices = useFuelPrices((s) => s.refresh);
  const today = useToday();
  const insets = useSafeAreaInsets();

  const [vehicleId, setVehicleId] = useState(existing?.vehicleId ?? paramVehicleId ?? vehicles[0]?.id ?? '');
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const [category, setCategory] = useState<ExpenseCategory>(existing?.category ?? paramCategory ?? 'yakit');
  const [date, setDate] = useState(existing?.date ?? today);
  const [amountText, setAmountText] = useState(existing ? toInput(existing.amount) : '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [kmText, setKmText] = useState(existing?.odometerKm != null ? String(existing.odometerKm) : '');
  const [fuelType, setFuelType] = useState<FuelType>(existing?.fuel?.fuelType ?? vehicle?.fuelType ?? 'benzin');
  const [litersText, setLitersText] = useState(existing?.fuel ? toInput(existing.fuel.liters) : '');
  const [priceText, setPriceText] = useState(existing?.fuel ? toInput(existing.fuel.pricePerLiter) : '');
  const [fullTank, setFullTank] = useState(existing?.fuel?.fullTank ?? true);
  /** Kullanıcı fiyatı elle değiştirdiyse güncel fiyat üzerine yazılmaz. */
  const priceTouched = useRef(Boolean(existing?.fuel));
  const isFuel = category === 'yakit';
  const livePrice = prices?.[fuelType] ?? null;

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? 'Kaydı düzenle' : isFuel ? 'Yakıt alımı' : 'Yeni masraf' });
  }, [navigation, existing, isFuel]);

  useEffect(() => {
    refreshPrices();
  }, [refreshPrices]);

  useEffect(() => {
    if (priceTouched.current || !livePrice) return;
    setPriceText(toInput(livePrice));
    const liters = parseDecimalTR(litersText);
    if (liters) setAmountText(toInput(round2(liters * livePrice)));
    // Yalnız fiyat ya da yakıt türü değişince çalışır; litre değişimi kendi işleyicisinde.
  }, [livePrice]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeVehicle = (next: string) => {
    setVehicleId(next);
    const v = vehicles.find((x) => x.id === next);
    if (v && !existing) setFuelType(v.fuelType);
  };

  const changeLiters = (text: string) => {
    setLitersText(text);
    const liters = parseDecimalTR(text);
    const price = parseDecimalTR(priceText);
    if (liters && price) setAmountText(toInput(round2(liters * price)));
  };

  const changePrice = (text: string) => {
    priceTouched.current = true;
    setPriceText(text);
    const price = parseDecimalTR(text);
    const liters = parseDecimalTR(litersText);
    const amount = parseDecimalTR(amountText);
    if (price && liters) setAmountText(toInput(round2(liters * price)));
    else if (price && amount) setLitersText(toInput(round2(amount / price)));
  };

  const changeAmount = (text: string) => {
    setAmountText(text);
    if (!isFuel) return;
    const amount = parseDecimalTR(text);
    const price = parseDecimalTR(priceText);
    if (amount && price) setLitersText(toInput(round2(amount / price)));
  };

  const changeFuelType = (next: FuelType) => {
    setFuelType(next);
    priceTouched.current = false;
  };

  const save = () => {
    if (!vehicleId) {
      Alert.alert('Araç seç', 'Masrafın hangi araca ait olduğunu seç.');
      return;
    }
    const amount = parseDecimalTR(amountText);
    if (amount === null || amount <= 0) {
      Alert.alert('Tutar gerekli', 'Ödediğin tutarı gir.');
      return;
    }
    const km = kmText.trim() ? parseDecimalTR(kmText) : null;
    if (kmText.trim() && (km === null || km < 0)) {
      Alert.alert('Geçersiz km', 'Kilometreyi rakamla yaz.');
      return;
    }
    let fuel: ExpenseInput['fuel'] = null;
    if (isFuel) {
      const liters = parseDecimalTR(litersText);
      const price = parseDecimalTR(priceText);
      if (!liters || !price) {
        Alert.alert('Litre ve fiyat gerekli', 'Tüketimi hesaplayabilmek için litreyi ve litre fiyatını gir.');
        return;
      }
      fuel = { liters, pricePerLiter: price, fuelType, fullTank };
    }
    const input: ExpenseInput = {
      vehicleId,
      date,
      category,
      amount,
      note: note.trim(),
      odometerKm: km !== null ? Math.round(km) : null,
      fuel,
    };
    if (existing) updateExpense(existing.id, input);
    else addExpense(input);
    navigation.goBack();
  };

  const confirmDelete = () =>
    Alert.alert('Kaydı sil', 'Bu masraf kaydı silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          if (existing) removeExpense(existing.id);
          navigation.goBack();
        },
      },
    ]);

  return (
    <View style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}>
        {vehicles.length > 1 ? (
          <ChipRow options={vehicles.map((v) => ({ value: v.id, label: v.plate }))} value={vehicleId} onChange={changeVehicle} />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kategori</Text>
          <View style={styles.grid}>
            {CATEGORIES.map((c) => {
              const meta = EXPENSE_META[c];
              const active = c === category;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.category, active && { borderColor: meta.color, backgroundColor: `${meta.color}14` }]}
                >
                  <Icon name={meta.icon} size={24} color={meta.color} />
                  <Text style={[styles.categoryLabel, active && { color: meta.color }]} numberOfLines={1}>
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {isFuel ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Yakıt</Text>
            <Segmented options={FUEL_OPTIONS} value={fuelType} onChange={changeFuelType} />
            <TextField label="Litre" value={litersText} onChangeText={changeLiters} keyboardType="decimal-pad" suffix="L" placeholder="0" />
            <TextField
              label="Litre fiyatı"
              value={priceText}
              onChangeText={changePrice}
              keyboardType="decimal-pad"
              suffix="TL/L"
              placeholder="0"
              hint={
                livePrice
                  ? `Güncel ülke ortalaması ${formatNumberTR(livePrice, 2)} TL. Pompadaki fiyat farklıysa onu yaz.`
                  : 'Pompadaki litre fiyatını yaz.'
              }
            />
            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <Text style={styles.label}>Depo full dolduruldu</Text>
                <Text style={styles.hint}>Tüketim, iki full depo arasındaki litre ve km'den hesaplanır.</Text>
              </View>
              <Switch value={fullTank} onValueChange={setFullTank} trackColor={{ true: colors.primary, false: colors.border }} />
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <TextField label="Tutar" value={amountText} onChangeText={changeAmount} keyboardType="decimal-pad" suffix="TL" placeholder="0" />
          <DateField label="Tarih" value={date} onChange={(value) => value && setDate(value)} />
          <TextField
            label="Kilometre"
            optional={!isFuel}
            value={kmText}
            onChangeText={setKmText}
            keyboardType="number-pad"
            suffix="km"
            placeholder={vehicle?.odometerKm != null ? String(vehicle.odometerKm) : 'Örn. 85000'}
            hint={isFuel ? 'Tüketim hesabı için gerekli.' : undefined}
          />
          <TextField label="Not" optional value={note} onChangeText={setNote} placeholder="Örn. Opet, yağ değişimi" autoCapitalize="sentences" />
        </View>

        {existing ? <Button variant="danger" icon="delete-outline" title="Kaydı sil" onPress={confirmDelete} /> : null}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  category: {
    width: '23%',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
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
