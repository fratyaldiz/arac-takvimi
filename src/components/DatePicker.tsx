import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useCallback, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { formatTR, parseISO, toISO, type ISODate } from '../utils/date';
import { Button } from './Button';

interface OpenOptions {
  title?: string;
  max?: ISODate;
}

interface IosRequest extends OpenOptions {
  resolve: (value: ISODate | null) => void;
}

/**
 * Tarih seçiciyi Promise olarak açar. Android'de sistem diyaloğu, iOS'ta
 * dönen `element` içindeki modal kullanılır; ekran `element`i render etmeli.
 */
export function useDatePicker() {
  const [request, setRequest] = useState<IosRequest | null>(null);
  const [draft, setDraft] = useState(new Date());

  const open = useCallback(
    (initial: ISODate | null, options: OpenOptions = {}) =>
      new Promise<ISODate | null>((resolve) => {
        const value = initial ? parseISO(initial) : new Date();
        if (Platform.OS === 'android') {
          DateTimePickerAndroid.open({
            value,
            mode: 'date',
            maximumDate: options.max ? parseISO(options.max) : undefined,
            onChange: (event, date) => resolve(event.type === 'set' && date ? toISO(date) : null),
          });
          return;
        }
        setDraft(value);
        setRequest({ ...options, resolve });
      }),
    [],
  );

  const close = (result: ISODate | null) => {
    request?.resolve(result);
    setRequest(null);
  };

  const element = (
    <Modal visible={request !== null} transparent animationType="fade" onRequestClose={() => close(null)}>
      <Pressable style={styles.backdrop} onPress={() => close(null)}>
        <Pressable style={styles.sheet}>
          {request?.title ? <Text style={styles.title}>{request.title}</Text> : null}
          <DateTimePicker
            value={draft}
            mode="date"
            display="inline"
            locale="tr-TR"
            themeVariant="light"
            maximumDate={request?.max ? parseISO(request.max) : undefined}
            onChange={(_, date) => date && setDraft(date)}
          />
          <View style={styles.buttons}>
            <View style={styles.flex}>
              <Button title="Vazgeç" variant="secondary" onPress={() => close(null)} />
            </View>
            <View style={styles.flex}>
              <Button title="Tamam" onPress={() => close(toISO(draft))} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return { open, element };
}

/**
 * Modal açmadan tarih seçimi: iOS'ta sistemin kompakt seçicisi, Android'de
 * sistem diyaloğu. Başka bir modalın içinde güvenle kullanılabilir.
 */
export function CompactDateInput({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: ISODate;
  onChange: (value: ISODate) => void;
  max?: ISODate;
}) {
  const maximumDate = max ? parseISO(max) : undefined;
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.compactRow}>
        <Text style={styles.label}>{label}</Text>
        <DateTimePicker
          value={parseISO(value)}
          mode="date"
          display="compact"
          locale="tr-TR"
          themeVariant="light"
          maximumDate={maximumDate}
          onChange={(_, date) => date && onChange(toISO(date))}
        />
      </View>
    );
  }
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.input, pressed && styles.pressed]}
        onPress={() =>
          DateTimePickerAndroid.open({
            value: parseISO(value),
            mode: 'date',
            maximumDate,
            onChange: (event, date) => {
              if (event.type === 'set' && date) onChange(toISO(date));
            },
          })
        }
      >
        <Text style={styles.value}>{formatTR(value)}</Text>
      </Pressable>
    </View>
  );
}

interface DateFieldProps {
  label: string;
  value: ISODate | null;
  onChange: (value: ISODate | null) => void;
  hint?: string;
  optional?: boolean;
}

export function DateField({ label, value, onChange, hint, optional }: DateFieldProps) {
  const picker = useDatePicker();
  const pick = async () => {
    const result = await picker.open(value, { title: label });
    if (result) onChange(result);
  };
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {optional ? <Text style={styles.optional}> (isteğe bağlı)</Text> : null}
      </Text>
      <View style={styles.inputRow}>
        <Pressable onPress={pick} style={({ pressed }) => [styles.input, pressed && styles.pressed]}>
          <Text style={value ? styles.value : styles.placeholder}>{value ? formatTR(value) : 'Tarih seç'}</Text>
        </Pressable>
        {value ? (
          <Pressable onPress={() => onChange(null)} hitSlop={8} style={styles.clear}>
            <Text style={styles.clearText}>Temizle</Text>
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {picker.element}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: radius + 4,
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  field: {
    gap: 6,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.bg,
  },
  pressed: {
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    fontSize: 16,
    color: colors.muted,
  },
  clear: {
    paddingVertical: 8,
  },
  clearText: {
    color: colors.primary,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
});
