import { LinearGradient } from 'expo-linear-gradient';
import { useLayoutEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { deadlineBadge, urgency } from '../components/deadlineFormat';
import { DeadlineRow } from '../components/DeadlineRow';
import { ExpenseRow } from '../components/ExpenseRow';
import { Icon, type IconName } from '../components/Icon';
import { PlateBadge } from '../components/PlateBadge';
import { ProgressRing } from '../components/ProgressRing';
import { useSheet } from '../components/Sheet';
import { Card, HeroStat, ListRow, SectionHeader } from '../components/ui';
import { fuelConsumption, sumBetween } from '../expenses/stats';
import { useStatusBar } from '../hooks/useStatusBar';
import { useToday } from '../hooks/useToday';
import type { ScreenProps } from '../navigation';
import { INSPECTION_LATE_FEE_PERCENT_PER_MONTH } from '../rules/regulations';
import {
  applyCompletion,
  COMPLETE_LABEL,
  computeDeadlines,
  deadlineStatus,
  fineDiscountDeadline,
  finePayableAmount,
  intervalText,
  NEEDS_DATE,
} from '../rules/schedule';
import { useGarage } from '../store/garage';
import { colors, EXPENSE_META, FUEL_LABEL, KIND_LABEL, PART_ICON, radius, shadow, STATUS_COLORS, VEHICLE_GRADIENTS } from '../theme';
import type { Deadline, DeadlineKind, PartItem } from '../types';
import { formatTR, type ISODate } from '../utils/date';
import { formatKm, formatNumberTR, formatTL } from '../utils/money';
import { openCompletePart, openOdometer, openPayFine } from './actions';

const DATE_QUESTION: Partial<Record<DeadlineKind, string>> = {
  muayene: 'Muayene hangi gün yapıldı?',
  trafik: 'Poliçe hangi gün yenilendi?',
  kasko: 'Kasko hangi gün yenilendi?',
  bakim: 'Bakım hangi gün yapıldı?',
};

const NEXT_LABEL: Partial<Record<DeadlineKind, string>> = {
  muayene: 'Sonraki muayene',
  trafik: 'Yeni poliçe bitişi',
  kasko: 'Yeni kasko bitişi',
  bakim: 'Sonraki bakım',
};

function confirmText(deadline: Deadline): string {
  switch (deadline.kind) {
    case 'mtv': {
      const [year, index] = deadline.key.split('-');
      return `${year} ${index}. taksit ödendi olarak işaretlensin mi?`;
    }
    case 'kisLastigi':
      return 'Kış lastikleri takıldı olarak işaretlensin mi?';
    case 'yazLastigi':
      return 'Yaz lastiklerine geçildi olarak işaretlensin mi?';
    default:
      return `${deadline.title} tamamlandı olarak işaretlensin mi?`;
  }
}

/** Alt form kapanırken iOS'ta Alert kaybolmasın diye kısa gecikme. */
function alertLater(title: string, message: string) {
  setTimeout(() => Alert.alert(title, message), 450);
}

export function VehicleDetailScreen({ navigation, route }: ScreenProps<'VehicleDetail'>) {
  useStatusBar('dark');
  const { id } = route.params;
  const vehicle = useGarage((s) => s.vehicles.find((v) => v.id === id));
  const allParts = useGarage((s) => s.parts);
  const allFines = useGarage((s) => s.fines);
  const allExpenses = useGarage((s) => s.expenses);
  const completeDeadline = useGarage((s) => s.completeDeadline);
  const completePart = useGarage((s) => s.completePart);
  const payFine = useGarage((s) => s.payFine);
  const setOdometer = useGarage((s) => s.setOdometer);
  const removeVehicle = useGarage((s) => s.removeVehicle);
  const today = useToday();
  const insets = useSafeAreaInsets();
  const sheet = useSheet();

  const parts = useMemo(() => allParts.filter((p) => p.vehicleId === id), [allParts, id]);
  const fines = useMemo(() => allFines.filter((f) => f.vehicleId === id && !f.paidDate), [allFines, id]);
  const expenses = useMemo(
    () => allExpenses.filter((e) => e.vehicleId === id).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [allExpenses, id],
  );
  const deadlines = useMemo(
    () => (vehicle ? computeDeadlines(vehicle, today, { parts, fines }) : []),
    [vehicle, today, parts, fines],
  );
  const consumption = useMemo(() => fuelConsumption(expenses), [expenses]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: vehicle?.plate ?? '',
      headerRight: () => (
        <Pressable hitSlop={10} onPress={() => navigation.navigate('VehicleForm', { id })}>
          <Text style={styles.headerLink}>Düzenle</Text>
        </Pressable>
      ),
    });
  }, [navigation, vehicle?.plate, id]);

  if (!vehicle) return null;

  const vehicleDeadlines = deadlines.filter((d) => d.kind !== 'parca' && d.kind !== 'ceza');
  const monthSpend = sumBetween(expenses, `${today.slice(0, 7)}-01`, today);
  const inspectionOverdue = deadlines.some((d) => d.kind === 'muayene' && deadlineStatus(d, today) === 'overdue');

  const complete = (deadline: Deadline) => {
    if (!NEEDS_DATE[deadline.kind]) {
      Alert.alert(deadline.title, confirmText(deadline), [
        { text: 'Vazgeç', style: 'cancel' },
        { text: COMPLETE_LABEL[deadline.kind], onPress: () => completeDeadline(deadline, today) },
      ]);
      return;
    }
    sheet.open({
      title: deadline.title,
      subtitle: DATE_QUESTION[deadline.kind],
      date: { initial: today, max: today, label: 'Tarih' },
      submitLabel: 'Kaydet',
      onSubmit: ({ date }) => {
        const done = date ?? today;
        completeDeadline(deadline, done);
        const next = computeDeadlines(applyCompletion(vehicle, deadline, done), today).find((d) => d.kind === deadline.kind);
        if (next?.due) alertLater('Kaydedildi', `${NEXT_LABEL[deadline.kind]}: ${formatTR(next.due)}`);
      },
    });
  };

  const confirmDelete = () =>
    Alert.alert('Aracı sil', `${vehicle.plate} ve tüm kayıtları (masraf, parça, ceza) silinsin mi? Bu işlem geri alınamaz.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          removeVehicle(id);
          navigation.goBack();
        },
      },
    ]);

  const quickActions: { icon: IconName; label: string; color: string; onPress: () => void }[] = [
    {
      icon: 'gas-station',
      label: 'Yakıt',
      color: EXPENSE_META.yakit.color,
      onPress: () => navigation.navigate('ExpenseForm', { vehicleId: id, category: 'yakit' }),
    },
    {
      icon: 'cash-plus',
      label: 'Masraf',
      color: '#16A34A',
      onPress: () => navigation.navigate('ExpenseForm', { vehicleId: id, category: 'bakim' }),
    },
    { icon: 'cog-outline', label: 'Parça', color: '#9333EA', onPress: () => navigation.navigate('PartForm', { vehicleId: id }) },
    {
      icon: 'alert-octagon-outline',
      label: 'Ceza',
      color: colors.danger,
      onPress: () => navigation.navigate('FineForm', { vehicleId: id }),
    },
  ];

  const missing = [
    !vehicle.inspectionDue && 'muayene tarihi',
    !vehicle.trafficInsuranceDue && 'trafik sigortası bitişi',
    !vehicle.lastServiceDate && 'son bakım tarihi',
  ].filter((item): item is string => Boolean(item));
  const missingText = missing.join(', ');

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <LinearGradient colors={VEHICLE_GRADIENTS[vehicle.color]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.bgIcon} pointerEvents="none">
            <Icon name={vehicle.kind === 'motosiklet' ? 'motorbike' : 'car-side'} size={150} color="rgba(255,255,255,0.16)" />
          </View>
          <PlateBadge plate={vehicle.plate} large />
          <Text style={styles.heroName}>{vehicle.name || KIND_LABEL[vehicle.kind]}</Text>
          <Text style={styles.heroMeta}>
            {[vehicle.name ? KIND_LABEL[vehicle.kind] : null, FUEL_LABEL[vehicle.fuelType]].filter(Boolean).join(' · ')}
          </Text>
          <View style={styles.heroStats}>
            <HeroStat
              label="Kilometre"
              value={vehicle.odometerKm !== null ? formatKm(vehicle.odometerKm) : 'Gir'}
              onPress={() => openOdometer(sheet.open, vehicle, setOdometer)}
            />
            <HeroStat label="Bu ay" value={formatTL(monthSpend, 0)} />
            <HeroStat label="L/100 km" value={consumption ? formatNumberTR(consumption.litersPer100Km, 1) : '—'} />
          </View>
        </LinearGradient>

        <View style={styles.quickActions}>
          {quickActions.map((a) => (
            <Pressable key={a.label} onPress={a.onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
              <View style={[styles.quickIcon, { backgroundColor: `${a.color}1F` }]}>
                <Icon name={a.icon} size={24} color={a.color} />
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {inspectionOverdue ? (
          <View style={styles.warning}>
            <Icon name="alert" size={20} color={colors.danger} />
            <Text style={styles.warningText}>
              Muayenesiz araçla trafiğe çıkmak idari para cezası gerektirir. Geciken her ay için muayene ücretine %
              {INSPECTION_LATE_FEE_PERCENT_PER_MONTH} zam eklenir.
            </Text>
          </View>
        ) : null}

        <SectionHeader title="Takvim" />
        {vehicleDeadlines.length === 0 ? (
          <Text style={styles.muted}>Henüz takip edilen bir tarih yok.</Text>
        ) : (
          vehicleDeadlines.map((d) => <DeadlineRow key={d.id} deadline={d} today={today} onComplete={() => complete(d)} />)
        )}

        {fines.length > 0 ? (
          <>
            <SectionHeader title="Ödenmemiş cezalar" />
            {fines.map((f) => {
              const deadline = fineDiscountDeadline(f);
              return (
                <ListRow
                  key={f.id}
                  icon="alert-octagon-outline"
                  iconColor={colors.danger}
                  iconBg={colors.dangerSoft}
                  title={f.reason ? `Ceza: ${f.reason}` : 'Trafik cezası'}
                  subtitle={
                    today <= deadline
                      ? `${formatTR(deadline)} tarihine kadar ${formatTL(finePayableAmount(f, today))}`
                      : `İndirim süresi geçti · ${formatTL(f.amount)}`
                  }
                  right={<Button small title="Ödedim" onPress={() => openPayFine(sheet.open, f, payFine)} />}
                />
              );
            })}
          </>
        ) : null}

        <SectionHeader title="Parça ve bakım" action={{ label: 'Ekle', onPress: () => navigation.navigate('PartForm', { vehicleId: id }) }} />
        {parts.length === 0 ? (
          <Card style={styles.gap}>
            <Text style={styles.muted}>
              Yağ, filtre, balata, akü gibi kalemleri ekle; km'si ya da süresi dolunca haber verelim.
            </Text>
            <View style={styles.start}>
              <Button small variant="secondary" icon="plus" title="Kalem ekle" onPress={() => navigation.navigate('PartForm', { vehicleId: id })} />
            </View>
          </Card>
        ) : (
          parts.map((p) => (
            <PartRow
              key={p.id}
              part={p}
              deadline={deadlines.find((d) => d.kind === 'parca' && d.key === p.id)}
              today={today}
              onPress={() => navigation.navigate('PartForm', { vehicleId: id, id: p.id })}
              onComplete={() => openCompletePart(sheet.open, p, vehicle, completePart)}
            />
          ))
        )}
        {vehicle.odometerKm === null && parts.some((p) => p.intervalKm) ? (
          <Text style={styles.muted}>Km'ye bağlı kalemler için yukarıdan aracın güncel kilometresini gir.</Text>
        ) : null}

        <SectionHeader
          title="Son masraflar"
          action={{ label: 'Ekle', onPress: () => navigation.navigate('ExpenseForm', { vehicleId: id }) }}
        />
        {expenses.length === 0 ? (
          <Text style={styles.muted}>Henüz masraf girilmedi.</Text>
        ) : (
          expenses
            .slice(0, 5)
            .map((e) => <ExpenseRow key={e.id} expense={e} onPress={() => navigation.navigate('ExpenseForm', { id: e.id })} />)
        )}

        {missing.length > 0 ? (
          <Card style={[styles.gap, styles.start]}>
            <Text style={styles.missingTitle}>Eksik bilgi</Text>
            <Text style={styles.muted}>
              {missingText.charAt(0).toUpperCase() + missingText.slice(1)} eklenmedi. Eklersen bunları da hatırlatırız.
            </Text>
            <Button small variant="secondary" title="Bilgileri tamamla" onPress={() => navigation.navigate('VehicleForm', { id })} />
          </Card>
        ) : null}

        <View style={styles.deleteWrap}>
          <Button variant="danger" icon="delete-outline" title="Aracı sil" onPress={confirmDelete} />
        </View>
      </ScrollView>
      {sheet.element}
    </View>
  );
}

function PartRow({
  part,
  deadline,
  today,
  onPress,
  onComplete,
}: {
  part: PartItem;
  deadline: Deadline | undefined;
  today: ISODate;
  onPress: () => void;
  onComplete: () => void;
}) {
  const tone = deadline ? STATUS_COLORS[deadlineStatus(deadline, today)] : null;
  const interval = intervalText(part.intervalKm, part.intervalMonths);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.partRow, pressed && styles.pressed]}>
      <ProgressRing progress={deadline ? urgency(deadline, today) : 0} color={tone?.fg ?? colors.border} size={50} stroke={4}>
        <View style={styles.partIcon}>
          <Icon name={PART_ICON[part.kind]} size={20} color="#9333EA" />
        </View>
      </ProgressRing>
      <View style={styles.flex}>
        <Text style={styles.partTitle}>{part.label}</Text>
        <Text style={styles.partSub}>{deadline ? interval : `${interval} · son değişim girilmedi`}</Text>
      </View>
      <View style={styles.partRight}>
        {deadline && tone ? (
          <View style={[styles.pill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.pillText, { color: tone.fg }]}>{deadlineBadge(deadline, today)}</Text>
          </View>
        ) : null}
        <Button small variant="secondary" title="Yaptırdım" onPress={onComplete} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  headerLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  hero: {
    borderRadius: 24,
    padding: 18,
    gap: 4,
    overflow: 'hidden',
  },
  bgIcon: {
    position: 'absolute',
    right: -14,
    top: 10,
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 10,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  heroStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius,
    paddingVertical: 14,
    paddingHorizontal: 8,
    ...shadow,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  warning: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius,
    padding: 14,
  },
  warningText: {
    flex: 1,
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  muted: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  gap: {
    gap: 10,
  },
  start: {
    alignItems: 'flex-start',
  },
  missingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 12,
    ...shadow,
  },
  partIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  partSub: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
  },
  partRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  deleteWrap: {
    marginTop: 20,
  },
});
