import type { IconName } from '../components/Icon';

/** Mağazadaki tek seferlik ürün. Her iki mağazada da aynı kimlik kullanılır. */
export const PRO_PRODUCT_ID = 'com.aractakvimi.app.pro';

/** Mağaza fiyatı okunamazsa gösterilecek yazı; gerçek fiyat mağazadan gelir. */
export const PRO_PRICE_FALLBACK = '99,99 ₺';

/** Ücretsiz sürümde tutulabilecek araç sayısı. */
export const FREE_VEHICLE_LIMIT = 1;

/** Paywall'ı açan yer; başlık ve açıklama buna göre değişir. */
export type ProTrigger = 'vehicle' | 'documents' | 'report' | 'export' | 'reminders' | 'settings';

export const TRIGGER_COPY: Record<ProTrigger, { title: string; body: string }> = {
  vehicle: {
    title: 'İkinci aracını ekle',
    body: `Ücretsiz sürümde ${FREE_VEHICLE_LIMIT} araç tutulur. Pro ile garajına istediğin kadar araç eklersin.`,
  },
  documents: {
    title: 'Belgelerin hep yanında',
    body: 'Ruhsat, poliçe ve muayene belgesini araca ekle; telefonda saklanır, internete gitmez.',
  },
  report: {
    title: 'Masraf raporu',
    body: 'Yıllık ve aylık dökümü, kategori dağılımını ve kilometre başına maliyeti gör.',
  },
  export: {
    title: 'Excel’e aktar',
    body: 'Masraflarını CSV olarak dışa aktar, istediğin tabloda aç.',
  },
  reminders: {
    title: 'Hatırlatmaları kendine göre ayarla',
    body: 'Kaç gün kala ve saat kaçta haber verileceğini sen seç.',
  },
  settings: {
    title: 'Araç Takvimi Pro',
    body: 'Tek seferlik ödeme, abonelik yok. Satın aldıktan sonra tüm özellikler açılır.',
  },
};

export interface ProFeature {
  icon: IconName;
  title: string;
  body: string;
}

export const PRO_FEATURES: ProFeature[] = [
  { icon: 'car-multiple', title: 'Sınırsız araç', body: 'Ailedeki ya da işteki bütün araçları tek garajda topla.' },
  { icon: 'file-document-multiple-outline', title: 'Belge cüzdanı', body: 'Ruhsat, poliçe ve muayene belgesi araca bağlı saklanır.' },
  { icon: 'chart-box-outline', title: 'Masraf raporu', body: 'Aylık/yıllık döküm, kategori dağılımı, km başına maliyet.' },
  { icon: 'table-arrow-right', title: 'CSV dışa aktarma', body: 'Masraf kayıtlarını Excel ya da Numbers’da aç.' },
  { icon: 'bell-cog-outline', title: 'Hatırlatma ayarı', body: 'Kaç gün kala ve hangi saatte bildirim geleceğini seç.' },
  { icon: 'cloud-off-outline', title: 'Yine sunucusuz', body: 'Pro da olsa kayıtların telefonunda kalır, üyelik istenmez.' },
];
