import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { FUEL_PRICE_SOURCE } from '../fuel/prices';
import { useFuelPrices } from '../store/fuel';
import { colors, FUEL_COLORS, FUEL_LABEL } from '../theme';
import type { FuelType } from '../types';
import { formatTR } from '../utils/date';
import { formatNumberTR } from '../utils/money';
import { Icon } from './Icon';

const ORDER: FuelType[] = ['benzin', 'motorin', 'lpg'];

export function FuelPriceTiles() {
  const data = useFuelPrices((s) => s.data);
  const loading = useFuelPrices((s) => s.loading);
  const error = useFuelPrices((s) => s.error);
  const refresh = useFuelPrices((s) => s.refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dates = data ? Object.values(data.priceDates).filter(Boolean).sort() : [];
  const latest = dates[dates.length - 1];

  return (
    <View style={styles.wrap}>
      <View style={styles.tiles}>
        {ORDER.map((type) => {
          const price = data?.prices[type] ?? null;
          return (
            <LinearGradient key={type} colors={FUEL_COLORS[type]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
              <View style={styles.tileTop}>
                <Icon name="gas-station" size={18} color="#FFFFFF" />
                <Text style={styles.tileLabel}>{FUEL_LABEL[type]}</Text>
              </View>
              <Text style={styles.price}>{price !== null ? formatNumberTR(price, 2) : '—'}</Text>
              <Text style={styles.unit}>TL / litre</Text>
            </LinearGradient>
          );
        })}
      </View>
      <View style={styles.footer}>
        <Text style={styles.source} numberOfLines={2}>
          {error && !data
            ? error
            : `${FUEL_PRICE_SOURCE}${latest ? ` · ${formatTR(latest)}` : ''}`}
        </Text>
        <Pressable onPress={() => refresh(true)} hitSlop={10} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Icon name="refresh" size={20} color={colors.primary} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    gap: 2,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tileLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  price: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  unit: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  source: {
    flex: 1,
    fontSize: 12,
    color: colors.muted,
  },
});
