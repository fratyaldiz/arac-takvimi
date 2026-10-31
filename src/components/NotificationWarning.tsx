import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { Icon } from './Icon';

/**
 * Bildirim izni yoksa hatırlatma kurulamıyor ve uygulama sessizce işe yaramaz
 * hale geliyor. Kullanıcı bunu ancak tarihi kaçırınca fark ederdi; bu şerit
 * durumu açıkça söyler. Ayarlardan izin açılınca otomatik kaybolur.
 */
export function NotificationWarning() {
  const [blocked, setBlocked] = useState(false);

  const check = useCallback(async () => {
    try {
      const { granted } = await Notifications.getPermissionsAsync();
      setBlocked(!granted);
    } catch {
      setBlocked(false);
    }
  }, []);

  useEffect(() => {
    check();
    // Kullanıcı Ayarlar'dan dönünce yeniden bakılır.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, [check]);

  if (!blocked) return null;

  return (
    <Pressable style={styles.wrap} onPress={() => Linking.openSettings()}>
      <Icon name="bell-off-outline" size={22} color={colors.danger} />
      <View style={styles.text}>
        <Text style={styles.title}>Bildirimler kapalı</Text>
        <Text style={styles.body}>
          Muayene, sigorta ve bakım hatırlatmaları gönderilemiyor. Açmak için dokun.
        </Text>
      </View>
      <Icon name="chevron-right" size={22} color={colors.danger} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius,
    padding: 14,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.danger,
  },
  body: {
    fontSize: 13,
    color: colors.danger,
    lineHeight: 18,
  },
});
