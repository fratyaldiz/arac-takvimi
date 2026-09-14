import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, EXPENSE_META, radius, shadow } from '../theme';
import type { Expense } from '../types';
import { formatTR } from '../utils/date';
import { formatKm, formatNumberTR, formatTL } from '../utils/money';
import { IconBadge } from './ui';

export function ExpenseRow({ expense, plate, onPress }: { expense: Expense; plate?: string; onPress?: () => void }) {
  const meta = EXPENSE_META[expense.category];
  const details = [
    plate,
    formatTR(expense.date),
    expense.fuel
      ? `${formatNumberTR(expense.fuel.liters, 2)} L × ${formatNumberTR(expense.fuel.pricePerLiter, 2)} TL`
      : null,
    expense.odometerKm !== null ? formatKm(expense.odometerKm) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <IconBadge icon={meta.icon} color={meta.color} bg={`${meta.color}1F`} size={42} />
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {meta.label}
          {expense.note ? ` · ${expense.note}` : ''}
        </Text>
        <Text style={styles.details} numberOfLines={1}>
          {details}
        </Text>
      </View>
      <Text style={styles.amount}>{formatTL(expense.amount)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 12,
    ...shadow,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  details: {
    fontSize: 12,
    color: colors.muted,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
});
