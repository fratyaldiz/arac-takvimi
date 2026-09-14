import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/Segmented';
import { toInput } from '../components/Sheet';
import { ChipRow, TextField } from '../components/ui';
import { fuelConsumption, tripCost } from '../expenses/stats';
import { useStatusBar } from '../hooks/useStatusBar';
import type { ScreenProps } from '../navigation';
import { useFuelPrices } from '../store/fuel';
import { useGarage } from '../store/garage';
import { colors, FUEL_LABEL, radius, shadow } from '../theme';
import type { FuelType } from '../types';
import { formatKm, formatNumberTR, formatTL, parseDecimalTR } from '../utils/money';

const FUEL_OPTIONS = (['benzin', 'motorin', 'lpg'] as FuelType[]).map((value) => ({ value, label: FUEL_LABEL[value] }));

export function TripScreen(_: ScreenProps<'Trip'>) {
  useStatusBar('dark');
  const vehicles = useGarage((s) => s.vehicles);
  const expenses = useGarage((s) => s.expenses);
  const prices = useFuelPrices((s) => s.data?.prices);
  const refreshPrices = useFuelPrices((s) => s.refresh);
  const insets = useSafeAreaInsets();

  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '');
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const consumption = useMemo(
    () => (vehicle ? fuelConsumption(expenses.filter((e) => e.vehicleId === vehicle.id)) : null),
    [vehicle, expenses],
  );

  const [distanceText, setDistanceText] = useState('');
  const [roundTrip, setRoundTrip] = useState(false);
  const [consText, setConsText] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>(vehicle?.fuelType ?? 'benzin');
  const [priceText, setPriceText] = useState('');
  const [tollText, setTollText] = useState('');
  const [people, setPeople] = useState(1);
  const priceTouched = useRef(false);
  const consTouched = useRef(false);
  const livePrice = prices?.[fuelType] ?? null;

  useEffect(() => {
    refreshPrices();
  }, [refreshPrices]);

  useEffect(() => {
    if (vehicle) setFuelType(vehicle.fuelType);
    consTouched.current = false;
    priceTouched.current = false;
  }, [vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!consTouched.current) setConsText(consumption ? toInput(Math.round(consumption.litersPer100Km * 10) / 10) : '');
  }, [consumption]);

  useEffect(() => {
    if (!priceTouched.current && livePrice) setPriceText(toInput(livePrice));
  }, [livePrice]);

  const distance = parseDecimalTR(distanceText);
  const cons = parseDecimalTR(consText);
  const price = parseDecimalTR(priceText);
  const tolls = tollText.trim() ? (parseDecimalTR(tollText) ?? 0) : 0;
  const result =
    distance && cons && price
      ? tripCost({ distanceKm: distance, litersPer100Km: cons, pricePerLiter: price, tolls, people, roundTrip })
      : null;

  return (
    <ScrollView
      style={styles.screen}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
    >
      <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.result}>
        <Text style={styles.resultLabel}>Toplam yol masrafı</Text>
        <Text style={styles.resultBig}>{result ? formatTL(result.total, 0) : '—'}</Text>
        <View style={styles.resultRow}>
          <ResultStat label="Kişi başı" value={result ? formatTL(result.perPerson, 0) : '—'} />
          <ResultStat label="Yakıt" value={result ? `${formatNumberTR(result.liters, 1)} L` : '—'} />
          <ResultStat label="Mesafe" value={result ? formatKm(result.km) : '—'} />
        </View>
      </LinearGradient>

      {vehicles.length > 1 ? (
        <ChipRow options={vehicles.map((v) => ({ value: v.id, label: v.plate }))} value={vehicleId} onChange={setVehicleId} />
      ) : null}

      <View style={styles.card}>
        <TextField label="Mesafe (tek yön)" value={distanceText} onChangeText={setDistanceText} keyboardType="decimal-pad" suffix="km" placeholder="Örn. 450" />
        <View style={styles.switchRow}>
          <Text style={styles.label}>Gidiş-dönüş</Text>
          <Switch value={roundTrip} onValueChange={setRoundTrip} trackColor={{ true: colors.primary, false: colors.border }} />
        </View>
        <TextField
          label="Tüketim"
          value={consText}
          onChangeText={(text) => {
            consTouched.current = true;
            setConsText(text);
          }}
          keyboardType="decimal-pad"
          suffix="L/100 km"
          placeholder="Örn. 6,5"
          hint={
            consumption
              ? `Yakıt kayıtlarına göre ortalaman ${formatNumberTR(consumption.litersPer100Km, 1)} L/100 km.`
              : 'Aracının ortalama tüketimini yaz. Yakıt kayıtların arttıkça kendimiz dolduracağız.'
          }
        />
        <Segmented
          options={FUEL_OPTIONS}
          value={fuelType}
          onChange={(next) => {
            setFuelType(next);
            priceTouched.current = false;
          }}
        />
        <TextField
          label="Yakıt fiyatı"
          value={priceText}
          onChangeText={(text) => {
            priceTouched.current = true;
            setPriceText(text);
          }}
          keyboardType="decimal-pad"
          suffix="TL/L"
          placeholder="0"
          hint={livePrice ? `Güncel ülke ortalaması ${formatNumberTR(livePrice, 2)} TL.` : undefined}
        />
        <TextField
          label="Köprü / otoyol (tek yön)"
          optional
          value={tollText}
          onChangeText={setTollText}
          keyboardType="decimal-pad"
          suffix="TL"
          placeholder="0"
        />
        <View style={styles.switchRow}>
          <Text style={styles.label}>Kişi sayısı</Text>
          <View style={styles.stepper}>
            <Pressable onPress={() => setPeople((p) => Math.max(1, p - 1))} style={styles.stepButton} hitSlop={6}>
              <Icon name="minus" size={20} color={colors.primary} />
            </Pressable>
            <Text style={styles.stepValue}>{people}</Text>
            <Pressable onPress={() => setPeople((p) => Math.min(9, p + 1))} style={styles.stepButton} hitSlop={6}>
              <Icon name="plus" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultStat}>
      <Text style={styles.resultStatValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </Text>
      <Text style={styles.resultStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  result: {
    borderRadius: 24,
    padding: 18,
    gap: 2,
  },
  resultLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  resultBig: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
  },
  resultRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  resultStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    padding: 10,
  },
  resultStatValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  resultStatLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    gap: 14,
    ...shadow,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
});
