import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from '../components/BarChart';
import { Button } from '../components/Button';
import { ExpenseRow } from '../components/ExpenseRow';
import { Card, ChipRow, EmptyHint, GradientHero, SectionHeader, screenStyles } from '../components/ui';
import { categoryTotals, fuelConsumption, monthlyTotals, sumBetween } from '../expenses/stats';
import { useStatusBar } from '../hooks/useStatusBar';
import { useToday } from '../hooks/useToday';
import type { TabProps } from '../navigation';
import { useGarage } from '../store/garage';
import { colors, EXPENSE_META } from '../theme';
import type { Expense, ExpenseCategory } from '../types';
import { addDays, addMonths, formatMonthTR } from '../utils/date';
import { formatNumberTR, formatTL } from '../utils/money';

export function ExpensesScreen({ navigation }: TabProps<'Masraflar'>) {
  useStatusBar('light');
  const vehicles = useGarage((s) => s.vehicles);
  const expenses = useGarage((s) => s.expenses);
  const today = useToday();
  const [filter, setFilter] = useState('all');
  const selected = filter === 'all' ? null : (vehicles.find((v) => v.id === filter) ?? null);

  const list = useMemo(
    () =>
      expenses
        .filter((e) => !selected || e.vehicleId === selected.id)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [expenses, selected],
  );

  const monthStart = `${today.slice(0, 7)}-01`;
  const thisMonth = sumBetween(list, monthStart, today);
  const lastMonth = sumBetween(list, addMonths(monthStart, -1), addDays(monthStart, -1));
  const months = monthlyTotals(list, today, 6);
  const categories = categoryTotals(list.filter((e) => e.date >= `${today.slice(0, 4)}-01-01`));
  const categoryMax = Math.max(1, ...categories.map((c) => c.total));
  const consumptionRows = (selected ? [selected] : vehicles)
    .map((v) => ({ vehicle: v, consumption: fuelConsumption(expenses.filter((e) => e.vehicleId === v.id)) }))
    .filter((r) => r.consumption !== null);
  const plateOf = (id: string) => (vehicles.length > 1 && !selected ? vehicles.find((v) => v.id === id)?.plate : undefined);

  const groups: { month: string; items: Expense[]; total: number }[] = [];
  for (const e of list) {
    const month = e.date.slice(0, 7);
    let group = groups[groups.length - 1];
    if (!group || group.month !== month) {
      group = { month, items: [], total: 0 };
      groups.push(group);
    }
    group.items.push(e);
    group.total += e.amount;
  }

  const add = (category: ExpenseCategory) => navigation.navigate('ExpenseForm', { category, vehicleId: selected?.id });

  return (
    <ScrollView style={screenStyles.scroll} contentContainerStyle={styles.bottom}>
      <GradientHero colors={['#059669', '#0EA5E9']}>
        <Text style={screenStyles.heroSubtitle}>Bu ay harcanan</Text>
        <Text style={screenStyles.heroBig}>{formatTL(thisMonth, 0)}</Text>
        <Text style={screenStyles.heroSubtitle}>Geçen ay {formatTL(lastMonth, 0)}</Text>
        <View style={styles.chart}>
          <BarChart data={months} barColor="#FFFFFF" labelColor="#FFFFFF" />
        </View>
      </GradientHero>

      <View style={screenStyles.content}>
        {vehicles.length === 0 ? (
          <EmptyHint
            icon="car-side"
            title="Önce aracını ekle"
            body="Masrafları araca göre tutuyoruz. Garaj sekmesinden aracını ekleyince buraya dönebilirsin."
            action={<Button title="Araç ekle" icon="plus" onPress={() => navigation.navigate('VehicleForm', {})} />}
          />
        ) : (
          <>
            {vehicles.length > 1 ? (
              <ChipRow
                options={[{ value: 'all', label: 'Tüm araçlar' }, ...vehicles.map((v) => ({ value: v.id, label: v.plate }))]}
                value={filter}
                onChange={setFilter}
              />
            ) : null}

            <View style={styles.actions}>
              <View style={styles.flex}>
                <Button title="Yakıt aldım" icon="gas-station" onPress={() => add('yakit')} />
              </View>
              <View style={styles.flex}>
                <Button title="Masraf ekle" icon="plus" variant="secondary" onPress={() => add('bakim')} />
              </View>
            </View>

            {consumptionRows.length > 0 ? (
              <Card style={styles.gap}>
                <Text style={styles.cardTitle}>Yakıt tüketimi</Text>
                {consumptionRows.map(({ vehicle, consumption }) => (
                  <View key={vehicle.id} style={styles.consumption}>
                    <Text style={styles.consumptionPlate}>{vehicle.plate}</Text>
                    <Text style={styles.consumptionValue}>
                      {formatNumberTR(consumption!.litersPer100Km, 1)} L/100 km
                    </Text>
                    <Text style={styles.consumptionCost}>{formatNumberTR(consumption!.costPerKm, 2)} TL/km</Text>
                  </View>
                ))}
              </Card>
            ) : list.some((e) => e.fuel) ? (
              <Text style={styles.hint}>
                Tüketim için iki "depo full" yakıt alımını km'siyle birlikte gir; ortalamayı biz çıkaralım.
              </Text>
            ) : null}

            {categories.length > 0 ? (
              <Card style={styles.gap}>
                <Text style={styles.cardTitle}>Bu yıl kategoriye göre</Text>
                {categories.map(({ category, total }) => {
                  const meta = EXPENSE_META[category];
                  return (
                    <View key={category} style={styles.categoryRow}>
                      <Text style={styles.categoryLabel}>{meta.label}</Text>
                      <View style={styles.track}>
                        <View style={[styles.fill, { width: `${(100 * total) / categoryMax}%`, backgroundColor: meta.color }]} />
                      </View>
                      <Text style={styles.categoryAmount}>{formatTL(total, 0)}</Text>
                    </View>
                  );
                })}
              </Card>
            ) : null}

            {groups.length === 0 ? (
              <EmptyHint
                icon="wallet-outline"
                title="Henüz masraf yok"
                body="Yakıt, bakım, otopark, köprü... Girdiğin her masraf burada aylık olarak toplanır."
              />
            ) : (
              groups.map((group) => (
                <View key={group.month} style={styles.group}>
                  <SectionHeader title={`${formatMonthTR(group.month)} · ${formatTL(group.total, 0)}`} />
                  {group.items.map((e) => (
                    <ExpenseRow
                      key={e.id}
                      expense={e}
                      plate={plateOf(e.vehicleId)}
                      onPress={() => navigation.navigate('ExpenseForm', { id: e.id })}
                    />
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bottom: {
    paddingBottom: 32,
  },
  chart: {
    marginTop: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  gap: {
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  consumption: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  consumptionPlate: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
    width: 96,
  },
  consumptionValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  consumptionCost: {
    fontSize: 13,
    color: colors.muted,
    marginLeft: 'auto',
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryLabel: {
    width: 96,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  fill: {
    height: 10,
    borderRadius: 5,
  },
  categoryAmount: {
    width: 84,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  group: {
    gap: 10,
  },
});
