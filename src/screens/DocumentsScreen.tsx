import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Card, ChipRow, EmptyHint, ListRow, SectionHeader } from '../components/ui';
import { deleteDocumentFile, documentFile, documentFileName, saveDocumentFile } from '../documents/files';
import { DOCUMENT_KINDS, DOCUMENT_META, formatBytes } from '../documents/meta';
import { useStatusBar } from '../hooks/useStatusBar';
import type { ScreenProps } from '../navigation';
import { useGarage } from '../store/garage';
import { colors, radius, shadow } from '../theme';
import type { DocumentKind } from '../types';
import { formatTR } from '../utils/date';

export function DocumentsScreen({ route, navigation }: ScreenProps<'Documents'>) {
  useStatusBar('dark');
  const { vehicleId } = route.params;
  const vehicle = useGarage((s) => s.vehicles.find((v) => v.id === vehicleId));
  const documents = useGarage((s) => s.documents.filter((d) => d.vehicleId === vehicleId));
  const addDocument = useGarage((s) => s.addDocument);
  const removeDocument = useGarage((s) => s.removeDocument);
  const [kind, setKind] = useState<DocumentKind>('ruhsat');
  const [busy, setBusy] = useState(false);

  if (!vehicle) {
    return (
      <View style={styles.screen}>
        <EmptyHint icon="car-off" title="Araç bulunamadı" body="Bu araç silinmiş olabilir." />
      </View>
    );
  }

  const add = async () => {
    setBusy(true);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets[0]) return;
      const asset = picked.assets[0];
      // Dosya adı kayıt kimliğinden türetilir; kullanıcının verdiği ad yalnız etikette durur.
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const fileName = documentFileName(id, asset.name ?? '');
      const { sizeBytes } = saveDocumentFile(asset.uri, fileName);
      addDocument({
        vehicleId,
        kind,
        label: asset.name ?? DOCUMENT_META[kind].label,
        fileName,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        sizeBytes: sizeBytes ?? asset.size ?? null,
      });
    } catch {
      Alert.alert('Belge eklenemedi', 'Dosya kopyalanırken bir sorun oldu. Tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  const open = async (fileName: string, mimeType: string) => {
    const file = documentFile(fileName);
    if (!file.exists) {
      Alert.alert('Dosya yok', 'Belge dosyası bulunamadı. Kaydı silip yeniden ekleyebilirsin.');
      return;
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Belge' });
    } else {
      Alert.alert('Açılamadı', 'Bu cihazda belge paylaşımı kullanılamıyor.');
    }
  };

  const confirmRemove = (id: string, fileName: string, label: string) =>
    Alert.alert('Belgeyi sil', `"${label}" silinsin mi? Dosya telefondan da kaldırılır.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          deleteDocumentFile(fileName);
          removeDocument(id);
        },
      },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.body}>
          {vehicle.plate} için ruhsat, poliçe ve muayene belgelerini burada tut. Dosyalar telefonun uygulama klasöründe
          saklanır, internete gönderilmez.
        </Text>
        <ChipRow
          options={DOCUMENT_KINDS.map((k) => ({ value: k, label: DOCUMENT_META[k].label }))}
          value={kind}
          onChange={setKind}
        />
        <Button title={`${DOCUMENT_META[kind].label} ekle`} icon="plus" onPress={add} disabled={busy} />
      </Card>

      <SectionHeader title={documents.length ? `Belgeler (${documents.length})` : 'Belgeler'} />
      {documents.length === 0 ? (
        <EmptyHint
          icon="file-document-multiple-outline"
          title="Henüz belge yok"
          body="PDF ya da fotoğraf ekleyebilirsin. Trafikte ruhsatını telefondan gösteremezsin ama poliçe ve servis belgeleri için pratiktir."
        />
      ) : (
        documents.map((doc) => {
          const meta = DOCUMENT_META[doc.kind];
          const size = formatBytes(doc.sizeBytes);
          return (
            <ListRow
              key={doc.id}
              icon={meta.icon}
              iconColor={meta.color}
              iconBg={colors.bg}
              title={doc.label}
              subtitle={`${meta.label} · ${formatTR(doc.addedAt)}${size ? ` · ${size}` : ''}`}
              onPress={() => open(doc.fileName, doc.mimeType)}
              right={
                <Pressable hitSlop={10} onPress={() => confirmRemove(doc.id, doc.fileName, doc.label)}>
                  <Icon name="trash-can-outline" size={20} color={colors.danger} />
                </Pressable>
              }
            />
          );
        })
      )}

      <Text style={styles.note}>
        Yedek dosyası belge kayıtlarını içerir ama dosyaların kendisini içermez; telefon değiştirirken belgeleri yeniden
        eklemen gerekir.
      </Text>
      <Button
        title="Araca dön"
        variant="secondary"
        small
        onPress={() => navigation.goBack()}
      />
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
  note: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 4,
  },
});
