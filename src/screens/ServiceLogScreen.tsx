import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Card, EmptyHint, SectionHeader } from '../components/ui';
import { serviceLog } from '../expenses/history';
import { useStatusBar } from '../hooks/useStatusBar';
import type { ScreenProps } from '../navigation';
import { useGarage } from '../store/garage';
import { colors, EXPENSE_META, radius, shadow } from '../theme';
import { formatTR } from '../utils/date';
import { formatKm, formatTL } from '../utils/money';

export function ServiceLogScreen({ route, navigation }: ScreenProps<'ServiceLog'>) {
  useStatusBar('dark');
  const { vehicleId } = route.params;
  const vehicle = useGarage((s) => s.vehicles.find((v) => v.id === vehicleId));
  const expenses = useGarage((s) => s.expenses);
  const parts = useGarage((s) => s.parts);

  const log = useMemo(() => serviceLog(expenses, vehicleId), [expenses, vehicleId]);
  const vehicleParts = useMemo(() => parts.filter((p) => p.vehicleId === vehicleId), [parts, vehicleId]);
  const total = log.reduce((sum, entry) => sum + entry.amount, 0);

  if (!vehicle) {
    return (
      <View style={styles.screen}>
        <EmptyHint icon="car-off" title="Araç bulunamadı" body="Bu araç silinmiş olabilir." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.plate}>{vehicle.plate}</Text>
        <Text style={styles.body}>
          Bakım, parça ve lastik masraflarından oluşan yapılan işler defteri. Aracı satarken alıcıya gösterebilirsin.
        </Text>
        <View style={styles.totals}>
          <Metric label="Kayıt" value={String(log.length)} />
          <Metric label="Toplam" value={formatTL(total, 0)} />
          <Metric label="Takipteki kalem" value={String(vehicleParts.length)} />
        </View>
      </Card>

      <SectionHeader title="Yapılan işler" />
      {log.length === 0 ? (
        <EmptyHint
          icon="wrench-outline"
          title="Defter boş"
          body="Bakım, parça ya da lastik masrafı ekledikçe burada tarih ve kilometresiyle birikir."
          action={
            <Button
              title="Masraf ekle"
              icon="plus"
              onPress={() => navigation.navigate('ExpenseForm', { vehicleId, category: 'bakim' })}
            />
          }
        />
      ) : (
        log.map((entry) => {
          const meta = EXPENSE_META[entry.category];
          return (
            <Card key={entry.id} style={styles.entry}>
              <View style={[styles.iconWrap, { backgroundColor: `${meta.color}1A` }]}>
                <Icon name={meta.icon} size={20} color={meta.color} />
              </View>
              <View style={styles.entryText}>
                <Text style={styles.entryTitle}>{entry.label || meta.label}</Text>
                <Text style={styles.entryMeta}>
                  {formatTR(entry.date)}
                  {entry.odometerKm !== null ? ` · ${formatKm(entry.odometerKm)}` : ''}
                </Text>
              </View>
              <Text style={styles.amount}>{formatTL(entry.amount, 0)}</Text>
            </Card>
          );
        })
      )}

      {vehicleParts.length > 0 ? (
        <>
          <SectionHeader title="Takip edilen kalemler" />
          <Card style={styles.card}>
            {vehicleParts.map((part) => (
              <Text key={part.id} style={styles.partRow}>
                • {part.label}
                {part.lastDate ? ` · son ${formatTR(part.lastDate)}` : ''}
                {part.lastKm !== null ? ` · ${formatKm(part.lastKm)}` : ''}
              </Text>
            ))}
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
    paddingBottom: 32,
    gap: 10,
  },
  card: {
    gap: 12,
    borderRadius: radius,
    ...shadow,
  },
  plate: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  body: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  totals: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius,
    padding: 14,
    ...shadow,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryText: {
    flex: 1,
    gap: 2,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  entryMeta: {
    fontSize: 12,
    color: colors.muted,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  partRow: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
});
