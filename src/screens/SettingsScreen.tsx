import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { backupFileName, backupSummary, createBackup, parseBackup } from '../backup/backup';
import { csvFileName, expensesToCsv } from '../backup/csv';
import { exportDeadlinesToCalendar } from '../calendar/sync';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Card, ChipRow, SectionHeader } from '../components/ui';
import { APP_STORE_REVIEW_URL, PLAY_STORE_REVIEW_URL, PRIVACY_URL, SUPPORT_EMAIL } from '../constants';
import { FUEL_PRICE_SOURCE } from '../fuel/prices';
import { useLanguageStore } from '../i18n/store';
import { useStatusBar } from '../hooks/useStatusBar';
import { useToday } from '../hooks/useToday';
import type { ScreenProps } from '../navigation';
import { syncNotifications } from '../notifications/scheduler';
import { PRO_VISIBLE } from '../pro/gate';
import { allDeadlines } from '../rules/schedule';
import { useGarage } from '../store/garage';
import { useIsPro } from '../store/pro';
import { useReview } from '../store/review';
import { colors, radius, shadow } from '../theme';

export function SettingsScreen({ navigation }: ScreenProps<'Settings'>) {
  useStatusBar('dark');
  const vehicles = useGarage((s) => s.vehicles);
  const expenses = useGarage((s) => s.expenses);
  const parts = useGarage((s) => s.parts);
  const fines = useGarage((s) => s.fines);
  const documents = useGarage((s) => s.documents);
  const parking = useGarage((s) => s.parking);
  const replaceAll = useGarage((s) => s.replaceAll);
  const pro = useIsPro();
  const languagePreference = useLanguageStore((s) => s.preference);
  const setLanguagePreference = useLanguageStore((s) => s.setPreference);
  const today = useToday();
  const dismissReview = useReview((s) => s.dismiss);
  const [busy, setBusy] = useState(false);

  const data = { vehicles, expenses, parts, fines, documents, parking };
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const exportBackup = async () => {
    setBusy(true);
    try {
      const now = new Date();
      const file = new File(Paths.cache, backupFileName(now));
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(createBackup(data, now), null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Araç Takvimi yedeği' });
      } else {
        Alert.alert('Yedek hazır', `Dosya oluşturuldu: ${file.uri}`);
      }
    } catch {
      Alert.alert('Yedek alınamadı', 'Dosya oluşturulurken bir sorun oldu. Tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    if (!pro) {
      navigation.navigate('Pro', { trigger: 'export' });
      return;
    }
    if (!expenses.length) {
      Alert.alert('Masraf yok', 'Dışa aktarılacak masraf kaydı bulunamadı.');
      return;
    }
    setBusy(true);
    try {
      const now = new Date();
      const file = new File(Paths.cache, csvFileName(now));
      if (file.exists) file.delete();
      file.create();
      file.write(expensesToCsv(expenses, vehicles));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Masraflar (CSV)' });
      } else {
        Alert.alert('Dosya hazır', `CSV oluşturuldu: ${file.uri}`);
      }
    } catch {
      Alert.alert('Dışa aktarılamadı', 'Dosya oluşturulurken bir sorun oldu. Tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  const exportToCalendar = async () => {
    setBusy(true);
    try {
      const deadlines = allDeadlines(vehicles, today, { parts, fines });
      const result = await exportDeadlinesToCalendar(deadlines, vehicles);
      if (result.ok) {
        Alert.alert(
          result.added ? 'Takvime eklendi' : 'Eklenecek tarih yok',
          result.added
            ? `${result.added} son tarih telefon takvimine yazıldı. Her biri için bir gün önceden hatırlatma kuruldu.`
            : 'Günü belli bir son tarih bulunamadı.',
        );
      } else if (result.reason === 'permission') {
        Alert.alert('Takvim izni yok', 'Ayarlardan takvim iznini açarsan son tarihleri oraya da yazabiliriz.');
      } else {
        Alert.alert('Eklenemedi', 'Takvime yazılırken bir sorun oldu. Tekrar dene.');
      }
    } finally {
      setBusy(false);
    }
  };

  const importBackup = async () => {
    setBusy(true);
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (picked.canceled || !picked.assets[0]) return;
      const result = parseBackup(new File(picked.assets[0].uri).textSync());
      if (!result.ok) {
        Alert.alert('Yedek okunamadı', result.error);
        return;
      }
      const summary = backupSummary(result.data);
      Alert.alert(
        'Yedekten geri yükle',
        `Yedekteki kayıtlar: ${summary}.\n\nTelefondaki mevcut kayıtların silinip yerine bunlar yazılacak. Devam edilsin mi?`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Geri yükle',
            style: 'destructive',
            onPress: () => {
              replaceAll(result.data);
              syncNotifications(result.data);
              Alert.alert('Geri yüklendi', summary);
            },
          },
        ],
      );
    } catch {
      Alert.alert('Yedek okunamadı', 'Dosya açılırken bir sorun oldu.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {PRO_VISIBLE ? (
        <>
          <SectionHeader title="Araç Takvimi Pro" />
          <Card style={styles.card}>
            <Text style={styles.body}>
              {pro
                ? 'Pro senin. Sınırsız araç, belge cüzdanı, masraf raporu ve CSV dışa aktarma açık.'
                : 'Tek seferlik ödemeyle sınırsız araç, belge cüzdanı, masraf raporu ve CSV dışa aktarma.'}
            </Text>
            <Button
              title={pro ? 'Pro ayrıntıları' : 'Pro’yu incele'}
              icon="star-four-points"
              variant={pro ? 'secondary' : 'primary'}
              onPress={() => navigation.navigate('Pro', { trigger: 'settings' })}
            />
          </Card>
        </>
      ) : null}

      <SectionHeader title="Dil" />
      <Card style={styles.card}>
        <Text style={styles.body}>Uygulamanın dilini seç. Sistem dilini seçersen telefonun diline uyar.</Text>
        <ChipRow
          options={[
            { value: 'system', label: 'Sistem dili' },
            { value: 'tr', label: 'Türkçe' },
            { value: 'en', label: 'İngilizce' },
          ]}
          value={languagePreference}
          onChange={setLanguagePreference}
        />
      </Card>

      <SectionHeader title="Yedekleme" />
      <Card style={styles.card}>
        <Text style={styles.body}>
          Tüm kayıtların yalnızca bu telefonda tutuluyor. Telefonu değiştirirken ya da uygulamayı silmeden önce yedek al.
        </Text>
        <Text style={styles.summary}>Şu an: {backupSummary(data)}</Text>
        <Button title="Yedek dosyası oluştur" icon="tray-arrow-down" onPress={exportBackup} disabled={busy} />
        <Button title="Yedekten geri yükle" icon="tray-arrow-up" variant="secondary" onPress={importBackup} disabled={busy} />
      </Card>

      {PRO_VISIBLE ? (
        <>
          <SectionHeader title="Dışa aktarma" />
          <Card style={styles.card}>
            <Text style={styles.body}>
              Masraf kayıtlarını CSV olarak çıkar, Excel ya da Numbers'da aç. Türkçe Excel için noktalı virgülle ayrılır.
            </Text>
            <Button
              title={pro ? 'Masrafları CSV olarak aktar' : 'CSV dışa aktarma (Pro)'}
              icon="table-arrow-right"
              variant="secondary"
              onPress={exportCsv}
              disabled={busy}
            />
          </Card>
        </>
      ) : null}

      <SectionHeader title="Telefon takvimi" />
      <Card style={styles.card}>
        <Text style={styles.body}>
          Son tarihleri telefonunun takvimine tüm gün etkinliği olarak yazar; bir gün öncesinden hatırlatma kurar.
          Uygulamayı silsen bile takvimde kalır. Tekrar basarsan kayıtlar ikinci kez eklenir.
        </Text>
        <Button
          title="Son tarihleri takvime ekle"
          icon="calendar-export"
          variant="secondary"
          onPress={exportToCalendar}
          disabled={busy}
        />
      </Card>

      <SectionHeader title="Bilgi kaynakları" />
      <Card style={styles.card}>
        <Row icon="gas-station" text={`Akaryakıt fiyatları: ${FUEL_PRICE_SOURCE}. İl ve istasyona göre fark edebilir.`} />
        <Row
          icon="scale-balance"
          text="Muayene periyotları, MTV tarihleri, lastik dönemleri ve ceza indirimi mevzuata göre kodlanmıştır."
        />
      </Card>

      <SectionHeader title="Yasal uyarı" />
      <Card style={styles.card}>
        <Text style={styles.body}>
          Uygulamadaki tarih ve tutarlar bilgilendirme amaçlıdır, resmi bildirim yerine geçmez. Mevzuat değişebilir;
          muayene tarihini ruhsattan ya da TÜVTÜRK'ten, vergi ve ceza bilgilerini e-Devlet üzerinden doğrula.
          Hatırlatmaların zamanında ulaşması telefonunun bildirim ayarlarına bağlıdır.
        </Text>
      </Card>

      <SectionHeader title="Gizlilik" />
      <Card style={styles.card}>
        <Text style={styles.body}>
          Kayıtların telefonda kalır, bir sunucuya gönderilmez. Konum yalnız "Park ettim" dediğinde ve sen izin verirsen
          alınır, yine telefonda saklanır. Uygulama yalnızca güncel akaryakıt fiyatlarını internetten çeker.
        </Text>
        <Button title="Gizlilik politikası" icon="shield-account-outline" variant="secondary" onPress={() => Linking.openURL(PRIVACY_URL)} />
      </Card>

      <SectionHeader title="Puan ver" />
      <Card style={styles.card}>
        <Text style={styles.body}>
          Uygulamayı beğendiysen mağazada puan vermen çok iyi olur; yeni kullanıcılar için tek referans o puanlar.
          Bir sorun varsa önce bize yaz, düzeltelim.
        </Text>
        <Button
          title="Mağazada puan ver"
          icon="star-outline"
          onPress={() => {
            // Elle basılan düğme sistem penceresini açamaz (Apple kuralı); mağaza sayfası açılır.
            dismissReview();
            Linking.openURL(Platform.OS === 'ios' ? APP_STORE_REVIEW_URL : PLAY_STORE_REVIEW_URL);
          }}
        />
      </Card>

      <SectionHeader title="Destek" />
      <Card style={styles.card}>
        <Text style={styles.body}>Sorun, öneri ve hata bildirimlerini bize yazabilirsin.</Text>
        <Button
          title={SUPPORT_EMAIL}
          icon="email-outline"
          variant="secondary"
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Ara%C3%A7%20Takvimi`)}
        />
      </Card>

      <SectionHeader title="Hakkında" />
      <Card style={styles.card}>
        <Text style={styles.body}>Araç Takvimi · sürüm {version}</Text>
        <Text style={styles.note}>İkonlar: Material Design Icons (Apache 2.0).</Text>
      </Card>
    </ScrollView>
  );
}

function Row({ icon, text }: { icon: Parameters<typeof Icon>[0]['name']; text: string }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={20} color={colors.primary} />
      <Text style={styles.rowText}>{text}</Text>
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
  body: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 21,
  },
  summary: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  note: {
    fontSize: 12,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  rowText: {
    flex: 1,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
  },
});
