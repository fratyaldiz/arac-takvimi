import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { DateField } from '../components/DatePicker';
import { Icon } from '../components/Icon';
import { ChipRow, TextField } from '../components/ui';
import { useStatusBar } from '../hooks/useStatusBar';
import { useToday } from '../hooks/useToday';
import type { ScreenProps } from '../navigation';
import { FINE_DISCOUNT_PERCENT, FINE_LATE_PERCENT_PER_MONTH } from '../rules/regulations';
import { fineDiscountDeadline, finePayableAmount } from '../rules/schedule';
import { useGarage } from '../store/garage';
import { colors, radius, shadow } from '../theme';
import { formatTR } from '../utils/date';
import { formatTL, parseDecimalTR } from '../utils/money';

export function FineFormScreen({ navigation, route }: ScreenProps<'FineForm'>) {
  useStatusBar('dark');
  const vehicles = useGarage((s) => s.vehicles);
  const addFine = useGarage((s) => s.addFine);
  const today = useToday();
  const insets = useSafeAreaInsets();

  const [vehicleId, setVehicleId] = useState(route.params?.vehicleId ?? vehicles[0]?.id ?? '');
  const [noticeDate, setNoticeDate] = useState(today);
  const [amountText, setAmountText] = useState('');
  const [reason, setReason] = useState('');

  const amount = parseDecimalTR(amountText);
  const preview = { id: '', vehicleId, noticeDate, amount: amount ?? 0, reason, paidDate: null, paidAmount: null };
  const deadline = fineDiscountDeadline(preview);

  const save = () => {
    if (!vehicleId) {
      Alert.alert('Araç seç', 'Cezanın hangi araca geldiğini seç.');
      return;
    }
    if (amount === null || amount <= 0) {
      Alert.alert('Tutar gerekli', 'Ceza tutarını gir.');
      return;
    }
    addFine({ vehicleId, noticeDate, amount, reason: reason.trim() });
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}>
        {vehicles.length > 1 ? (
          <ChipRow options={vehicles.map((v) => ({ value: v.id, label: v.plate }))} value={vehicleId} onChange={setVehicleId} />
        ) : null}

        <View style={styles.card}>
          <DateField
            label="Tebliğ tarihi"
            value={noticeDate}
            onChange={(value) => value && setNoticeDate(value)}
            hint="Cezanın sana bildirildiği gün; tutanakta ya da e-Devlet sorgusunda yazar."
          />
          <TextField label="Ceza tutarı" value={amountText} onChangeText={setAmountText} keyboardType="decimal-pad" suffix="TL" placeholder="0" />
          <TextField
            label="Sebep"
            optional
            value={reason}
            onChangeText={setReason}
            placeholder="Örn. hız, park, kırmızı ışık"
            autoCapitalize="sentences"
          />
        </View>

        <View style={styles.info}>
          <Icon name="information-outline" size={22} color={colors.primary} />
          <View style={styles.flex}>
            <Text style={styles.infoTitle}>İndirimli son gün: {formatTR(deadline)}</Text>
            <Text style={styles.infoBody}>
              {amount
                ? `Bu tarihe kadar ödersen %${FINE_DISCOUNT_PERCENT} indirimle ${formatTL(finePayableAmount(preview, noticeDate))} ödersin.`
                : `Tebliğden itibaren 1 ay içinde ödenen cezaya %${FINE_DISCOUNT_PERCENT} indirim uygulanır.`}{' '}
              Süre geçerse aylık %{FINE_LATE_PERCENT_PER_MONTH} faiz işler.
            </Text>
          </View>
        </View>
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
  info: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.primarySoft,
    borderRadius: radius,
    padding: 14,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  infoBody: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    marginTop: 2,
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
