import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { DeadlineRow } from '../components/DeadlineRow';
import { Icon, type IconName } from '../components/Icon';
import { GradientHero, HeroStat, IconBadge, SectionHeader, screenStyles } from '../components/ui';
import { useStatusBar } from '../hooks/useStatusBar';
import { useToday } from '../hooks/useToday';
import type { TabProps } from '../navigation';
import { SOON_THRESHOLD_DAYS } from '../rules/regulations';
import { allDeadlines, deadlineStatus } from '../rules/schedule';
import { useGarage } from '../store/garage';
import { colors, DEADLINE_META, EXPENSE_META, radius, shadow } from '../theme';
import { daysBetween, formatTR, weekdayTR } from '../utils/date';

const UPCOMING_WINDOW_DAYS = 60;

const FEATURES: { icon: IconName; color: string; bg: string; text: string }[] = [
  { ...DEADLINE_META.muayene, text: 'TÜVTÜRK muayenesi' },
  { ...DEADLINE_META.trafik, text: 'Trafik sigortası ve kasko' },
  { ...DEADLINE_META.mtv, text: 'MTV taksitleri (Ocak ve Temmuz)' },
  { ...DEADLINE_META.kisLastigi, text: 'Kış ve yaz lastiği' },
  { icon: EXPENSE_META.yakit.icon, color: EXPENSE_META.yakit.color, bg: '#FFEDD5', text: 'Yakıt, tüketim ve masraflar' },
  { icon: 'parking', color: '#0891B2', bg: '#CFFAFE', text: 'Otopark ve yolculuk hesabı' },
];

export function CalendarScreen({ navigation }: TabProps<'Takvim'>) {
  useStatusBar('light');
  const vehicles = useGarage((s) => s.vehicles);
  const parts = useGarage((s) => s.parts);
  const fines = useGarage((s) => s.fines);
  const today = useToday();
  const deadlines = useMemo(() => allDeadlines(vehicles, today, { parts, fines }), [vehicles, parts, fines, today]);
  const addVehicle = () => navigation.navigate('VehicleForm', {});

  if (vehicles.length === 0) return <Welcome onAdd={addVehicle} />;

  const statuses = deadlines.map((d) => deadlineStatus(d, today));
  const overdue = statuses.filter((s) => s === 'overdue').length;
  const soon = statuses.filter((s) => s === 'soon').length;
  const upcoming = deadlines.filter(
    (d, i) => statuses[i] !== 'ok' || (d.due !== null && daysBetween(today, d.due) <= UPCOMING_WINDOW_DAYS),
  );
  const later = deadlines.filter((d) => !upcoming.includes(d));
  const plateOf = (id: string) => (vehicles.length > 1 ? vehicles.find((v) => v.id === id)?.plate : undefined);
  const open = (id: string) => navigation.navigate('VehicleDetail', { id });
  const headline = overdue > 0 ? `${overdue} işin süresi geçti` : soon > 0 ? `${soon} iş yaklaşıyor` : 'Her şey yolunda';

  return (
    <ScrollView style={screenStyles.scroll} contentContainerStyle={styles.bottom}>
      <GradientHero colors={['#2563EB', '#7C3AED']}>
        <Text style={screenStyles.heroSubtitle}>
          {weekdayTR(today)}, {formatTR(today)}
        </Text>
        <Text style={screenStyles.heroTitle}>{headline}</Text>
        <View style={screenStyles.heroStats}>
          <HeroStat label="Süresi geçmiş" value={String(overdue)} />
          <HeroStat label={`${SOON_THRESHOLD_DAYS} gün içinde`} value={String(soon)} />
          <HeroStat label="Takipteki iş" value={String(deadlines.length)} />
        </View>
      </GradientHero>

      <View style={screenStyles.content}>
        <SectionHeader title="Yaklaşanlar" />
        {upcoming.length === 0 ? (
          <Text style={styles.empty}>
            {deadlines.length === 0
              ? 'Henüz takip edilen tarih yok. Garaj sekmesinden aracına tarih ekle.'
              : `Önümüzdeki ${UPCOMING_WINDOW_DAYS} günde yapılacak iş yok.`}
          </Text>
        ) : (
          upcoming.map((d) => (
            <DeadlineRow key={d.id} deadline={d} today={today} plate={plateOf(d.vehicleId)} onPress={() => open(d.vehicleId)} />
          ))
        )}

        {later.length > 0 ? (
          <>
            <SectionHeader title="Daha sonra" />
            {later.map((d) => (
              <DeadlineRow key={d.id} deadline={d} today={today} plate={plateOf(d.vehicleId)} onPress={() => open(d.vehicleId)} />
            ))}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

function Welcome({ onAdd }: { onAdd: () => void }) {
  return (
    <ScrollView style={screenStyles.scroll} contentContainerStyle={styles.bottom}>
      <GradientHero colors={['#2563EB', '#7C3AED']}>
        <View style={styles.welcomeIcon}>
          <Icon name="car-side" size={52} color="#FFFFFF" />
        </View>
        <Text style={screenStyles.heroTitle}>Aracının son tarihlerini kaçırma</Text>
        <Text style={[screenStyles.heroSubtitle, styles.welcomeBody]}>
          Plakanı ve ruhsattaki tarihleri gir; muayene, sigorta, MTV ve bakım zamanı gelince haber verelim.
        </Text>
      </GradientHero>
      <View style={screenStyles.content}>
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.feature}>
              <IconBadge icon={f.icon} color={f.color} bg={f.bg} size={40} />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
        <Button title="İlk aracını ekle" icon="plus" onPress={onAdd} />
        <Text style={styles.privacy}>Bilgilerin yalnızca telefonunda saklanır.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bottom: {
    paddingBottom: 32,
  },
  empty: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  welcomeIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeBody: {
    marginTop: 8,
    lineHeight: 22,
  },
  features: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    gap: 14,
    ...shadow,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  privacy: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});
