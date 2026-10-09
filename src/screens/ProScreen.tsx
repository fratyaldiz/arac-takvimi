import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Card } from '../components/ui';
import { PRIVACY_URL } from '../constants';
import { useStatusBar } from '../hooks/useStatusBar';
import type { ScreenProps } from '../navigation';
import { PRO_FEATURES, PRO_PRICE_FALLBACK, TRIGGER_COPY } from '../pro/features';
import { loadPrice, purchasePro, PURCHASES_ENABLED, restorePro } from '../pro/iap';
import { useProStore } from '../store/pro';
import { colors, radius, shadow } from '../theme';

export function ProScreen({ route, navigation }: ScreenProps<'Pro'>) {
  useStatusBar('light');
  const owned = useProStore((s) => s.owned);
  const price = useProStore((s) => s.price);
  const setPrice = useProStore((s) => s.setPrice);
  const setOwned = useProStore((s) => s.setOwned);
  const [busy, setBusy] = useState(false);
  const copy = TRIGGER_COPY[route.params?.trigger ?? 'settings'];

  useEffect(() => {
    let active = true;
    loadPrice()
      .then((value) => active && setPrice(value))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [setPrice]);

  const run = async (action: typeof purchasePro, successTitle: string) => {
    setBusy(true);
    try {
      const result = await action();
      if (result.ok) {
        setOwned(true);
        Alert.alert(successTitle, 'Tüm Pro özellikleri açıldı.', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
      } else if (result.reason !== 'cancelled') {
        Alert.alert('Olmadı', result.message ?? 'Mağazaya bağlanılamadı. Daha sonra tekrar dene.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient colors={['#2563EB', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.badge}>
          <Icon name="star-four-points" size={16} color="#FFFFFF" />
          <Text style={styles.badgeText}>PRO</Text>
        </View>
        <Text style={styles.heroTitle}>{copy.title}</Text>
        <Text style={styles.heroBody}>{copy.body}</Text>
      </LinearGradient>

      <Card style={styles.card}>
        {PRO_FEATURES.map((feature) => (
          <View key={feature.title} style={styles.feature}>
            <View style={styles.featureIcon}>
              <Icon name={feature.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureBody}>{feature.body}</Text>
            </View>
          </View>
        ))}
      </Card>

      {owned ? (
        <Card style={styles.card}>
          <View style={styles.ownedRow}>
            <Icon name="check-decagram" size={22} color={colors.ok} />
            <Text style={styles.ownedText}>Pro senin. Tüm özellikler açık.</Text>
          </View>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Text style={styles.price}>{price ?? PRO_PRICE_FALLBACK}</Text>
          <Text style={styles.priceNote}>Tek seferlik ödeme. Abonelik yok, yenileme yok.</Text>
          <Button
            title={PURCHASES_ENABLED ? 'Pro’ya geç' : 'Satın alma yakında'}
            icon="star-four-points"
            onPress={() => run(purchasePro, 'Teşekkürler!')}
            disabled={busy || !PURCHASES_ENABLED}
          />
          <Button
            title="Satın alımları geri yükle"
            icon="restore"
            variant="secondary"
            onPress={() => run(restorePro, 'Geri yüklendi')}
            disabled={busy || !PURCHASES_ENABLED}
          />
          {!PURCHASES_ENABLED ? (
            <Text style={styles.note}>
              Pro özellikleri hazırlanıyor. Satın alma açıldığında bu ekrandan tek dokunuşla geçebileceksin.
            </Text>
          ) : null}
        </Card>
      )}

      <Text style={styles.legal}>
        Ödeme {'App Store / Google Play'} hesabından tahsil edilir. Satın alma cihazına değil hesabına bağlıdır; yeni
        telefonda "Satın alımları geri yükle" ile açılır.
      </Text>
      <Button title="Gizlilik politikası" variant="secondary" small onPress={() => Linking.openURL(PRIVACY_URL)} />
    </ScrollView>
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
    gap: 12,
  },
  hero: {
    borderRadius: radius,
    padding: 20,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroBody: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 21,
  },
  card: {
    gap: 14,
    borderRadius: radius,
    ...shadow,
  },
  feature: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  featureBody: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  priceNote: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: -8,
  },
  note: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    textAlign: 'center',
  },
  ownedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ownedText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  legal: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },
});
