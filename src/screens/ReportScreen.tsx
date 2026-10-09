import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { PlateBadge } from '../components/PlateBadge';
import { Segmented } from '../components/Segmented';
import { Card, EmptyHint, SectionHeader } from '../components/ui';
import { buildReport, reportPeriods } from '../expenses/report';
import { useStatusBar } from '../hooks/useStatusBar';
import { useToday } from '../hooks/useToday';
import type { ScreenProps } from '../navigation';
import { useGarage } from '../store/garage';
import { colors, EXPENSE_META, radius, shadow } from '../theme';
import { formatTR } from '../utils/date';
import { formatKm, formatNumberTR, formatTL } from '../utils/money';

export function ReportScreen(_: ScreenProps<'Report'>) {
  useStatusBar('dark');
  const vehicles = useGarage((s) => s.vehicles);
  const expenses = useGarage((s) => s.expenses);
  const today = useToday();

  const firstRecord = useMemo(
    () => expenses.reduce<string | null>((min, e) => (!min || e.date < min ? e.date : min), null),
    [expenses],
  );
  const periods = useMemo(() => reportPeriods(today, firstRecord), [today, firstRecord]);
  const [periodKey, setPeriodKey] = useState(periods[0].key);
  const period = periods.find((p) => p.key === periodKey) ?? periods[0];
  const report = useMemo(
    () => buildReport(expenses, vehicles, period.from, period.to),
    [expenses, vehicles, period.from, period.to],
  );
  const categoryMax = Math.max(1, ...report.categories.map((c) => c.total));
  const vehicleName = (id: string) => vehicles.find((v) => v.id === id);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Segmented options={periods.map((p) => ({ value: p.key, label: p.label }))} value={periodKey} onChange={setPeriodKey} />

      <Card style={styles.total}>
        <Text style={styles.totalLabel}>{period.label} toplam masraf</Text>
        <Text style={styles.totalValue}>{formatTL(report.total, 0)}</Text>
        <Text style={styles.totalNote}>
          {report.count} kayıt · {formatTR(period.from)} – {formatTR(period.to)}
        </Text>
      </Card>

      {report.count === 0 ? (
        <EmptyHint icon="chart-box-outline" title="Bu dönemde kayıt yok" body="Masraf ekledikçe rapor burada oluşur." />
      ) : (
        <>
          <SectionHeader title="Kategoriler" />
          <Card style={styles.card}>
            {report.categories.map((row) => {
              const meta = EXPENSE_META[row.category];
              return (
                <View key={row.category} style={styles.catRow}>
                  <View style={styles.catTop}>
                    <Icon name={meta.icon} size={16} color={meta.color} />
                    <Text style={styles.catLabel}>{meta.label}</Text>
                    <Text style={styles.catValue}>{formatTL(row.total, 0)}</Text>
                    <Text style={styles.catShare}>%{formatNumberTR((row.total / report.total) * 100, 0)}</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${(row.total / categoryMax) * 100}%`, backgroundColor: meta.color }]} />
                  </View>
                </View>
              );
            })}
          </Card>

          <SectionHeader title="Araçlar" />
          {report.byVehicle.map((row) => {
            const vehicle = vehicleName(row.vehicleId);
            return (
              <Card key={row.vehicleId} style={styles.card}>
                <View style={styles.vehicleTop}>
                  {vehicle ? <PlateBadge plate={vehicle.plate} /> : null}
                  <Text style={styles.vehicleName} numberOfLines={1}>
                    {vehicle?.name || vehicle?.plate || 'Silinmiş araç'}
                  </Text>
                  <Text style={styles.vehicleTotal}>{formatTL(row.total, 0)}</Text>
                </View>
                <View style={styles.metrics}>
                  <Metric label="Kayıt" value={String(row.count)} />
                  <Metric label="Km (okuma farkı)" value={row.kmDriven === null ? '—' : formatKm(row.kmDriven)} />
                  <Metric label="Km başına" value={row.costPerKm === null ? '—' : `${formatNumberTR(row.costPerKm, 2)} TL`} />
                </View>
                {row.kmDriven === null ? (
                  <Text style={styles.note}>Masraf girerken kilometre de yazarsan km başına maliyet hesaplanır.</Text>
                ) : null}
              </Card>
            );
          })}

          {report.largest ? (
            <>
              <SectionHeader title="En büyük masraf" />
              <Card style={styles.card}>
                <Text style={styles.largestValue}>{formatTL(report.largest.amount)}</Text>
                <Text style={styles.note}>
                  {EXPENSE_META[report.largest.category].label} · {formatTR(report.largest.date)}
                  {report.largest.note ? ` · ${report.largest.note}` : ''}
                </Text>
              </Card>
            </>
          ) : null}
        </>
      )}
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
  total: {
    gap: 4,
    alignItems: 'center',
    borderRadius: radius,
    ...shadow,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  totalNote: {
    fontSize: 12,
    color: colors.muted,
  },
  catRow: {
    gap: 6,
  },
  catTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  catValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  catShare: {
    width: 44,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  vehicleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vehicleName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  vehicleTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  metrics: {
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
  largestValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  note: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },
});
