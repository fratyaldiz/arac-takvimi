import { StyleSheet, Text, View } from 'react-native';
import type { MonthTotal } from '../expenses/stats';
import { formatNumberTR } from '../utils/money';

function compact(value: number): string {
  if (value >= 1000) return `${formatNumberTR(value / 1000, value >= 10000 ? 0 : 1)} bin`;
  return formatNumberTR(value);
}

/** Son aylar için sade çubuk grafik; son çubuk (bu ay) vurgulanır. */
export function BarChart({ data, barColor, labelColor }: { data: MonthTotal[]; barColor: string; labelColor: string }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <View style={styles.wrap}>
      {data.map((d, i) => {
        const current = i === data.length - 1;
        return (
          <View key={d.month} style={styles.column}>
            <Text style={[styles.value, { color: labelColor }]} numberOfLines={1}>
              {d.total > 0 ? compact(d.total) : ''}
            </Text>
            <View
              style={[
                styles.bar,
                { height: Math.max(4, (84 * d.total) / max), backgroundColor: barColor, opacity: current ? 1 : 0.45 },
              ]}
            />
            <Text style={[styles.label, { color: labelColor }, current && styles.current]}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 124,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  value: {
    fontSize: 10,
    fontWeight: '700',
  },
  bar: {
    width: '72%',
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.85,
  },
  current: {
    fontWeight: '800',
    opacity: 1,
  },
});
