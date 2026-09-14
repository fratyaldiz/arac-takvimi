import { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { todayISO, type ISODate } from '../utils/date';
import { parseDecimalTR } from '../utils/money';
import { Button } from './Button';
import { CompactDateInput } from './DatePicker';
import { TextField } from './ui';

export interface SheetValues {
  date: ISODate | null;
  km: number | null;
  amount: number | null;
}

export interface SheetRequest {
  title: string;
  subtitle?: string;
  date?: { initial: ISODate; max?: ISODate; label?: string };
  km?: { initial: number | null; required?: boolean; label?: string };
  amount?: {
    label: string;
    initial: number | null;
    required?: boolean;
    /** Tarih değişince tutarı yeniden hesaplar (ör. ceza indirimi). */
    recompute?: (date: ISODate) => number | null;
  };
  submitLabel: string;
  onSubmit: (values: SheetValues) => void;
}

export type OpenSheet = (request: SheetRequest) => void;

/** Sayıyı giriş kutusuna Türkçe ondalıkla yazar: 1500.5 → "1500,5". */
export function toInput(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
}

/** Alttan açılan küçük form: tarih, km ve tutar alanlarından istenenleri gösterir. */
export function useSheet() {
  const [request, setRequest] = useState<SheetRequest | null>(null);
  const open = useCallback<OpenSheet>((r) => setRequest(r), []);
  const element = <SheetModal request={request} onClose={() => setRequest(null)} />;
  return { open, element };
}

function SheetModal({ request, onClose }: { request: SheetRequest | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState<ISODate>(todayISO());
  const [kmText, setKmText] = useState('');
  const [amountText, setAmountText] = useState('');

  useEffect(() => {
    if (!request) return;
    setDate(request.date?.initial ?? todayISO());
    setKmText(request.km?.initial != null ? String(request.km.initial) : '');
    setAmountText(request.amount?.initial != null ? toInput(request.amount.initial) : '');
  }, [request]);

  if (!request) return null;

  const changeDate = (value: ISODate) => {
    setDate(value);
    const recomputed = request.amount?.recompute?.(value);
    if (recomputed != null) setAmountText(toInput(recomputed));
  };

  const submit = () => {
    const km = kmText.trim() ? parseDecimalTR(kmText) : null;
    const amount = amountText.trim() ? parseDecimalTR(amountText) : null;
    if (kmText.trim() && (km === null || km < 0)) {
      Alert.alert('Geçersiz km', 'Kilometreyi rakamla yaz.');
      return;
    }
    if (request.km?.required && km === null) {
      Alert.alert('Km gerekli', 'Güncel kilometreyi gir.');
      return;
    }
    if (amountText.trim() && (amount === null || amount < 0)) {
      Alert.alert('Geçersiz tutar', 'Tutarı rakamla yaz.');
      return;
    }
    if (request.amount?.required && (amount === null || amount <= 0)) {
      Alert.alert('Tutar gerekli', 'Ödenen tutarı gir.');
      return;
    }
    request.onSubmit({ date: request.date ? date : null, km: km !== null ? Math.round(km) : null, amount });
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{request.title}</Text>
          {request.subtitle ? <Text style={styles.subtitle}>{request.subtitle}</Text> : null}
          {request.date ? (
            <CompactDateInput label={request.date.label ?? 'Tarih'} value={date} onChange={changeDate} max={request.date.max} />
          ) : null}
          {request.km ? (
            <TextField
              label={request.km.label ?? 'Kilometre'}
              value={kmText}
              onChangeText={setKmText}
              keyboardType="number-pad"
              suffix="km"
              placeholder="Örn. 85000"
            />
          ) : null}
          {request.amount ? (
            <TextField
              label={request.amount.label}
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="decimal-pad"
              suffix="TL"
              placeholder="0"
            />
          ) : null}
          <View style={styles.buttons}>
            <View style={styles.flex}>
              <Button title="Vazgeç" variant="secondary" onPress={onClose} />
            </View>
            <View style={styles.flex}>
              <Button title={request.submitLabel} onPress={submit} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: -8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
