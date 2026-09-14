import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COMPLETE_LABEL, deadlineStatus } from '../rules/schedule';
import { colors, DEADLINE_META, radius, shadow, STATUS_COLORS } from '../theme';
import type { Deadline } from '../types';
import type { ISODate } from '../utils/date';
import { Button } from './Button';
import { deadlineBadge, deadlineDateText, urgency } from './deadlineFormat';
import { Icon } from './Icon';
import { ProgressRing } from './ProgressRing';

interface Props {
  deadline: Deadline;
  today: ISODate;
  /** Birden çok aracın işleri karışık listelenirken gösterilir. */
  plate?: string;
  onPress?: () => void;
  onComplete?: () => void;
}

export function DeadlineRow({ deadline, today, plate, onPress, onComplete }: Props) {
  const status = deadlineStatus(deadline, today);
  const tone = STATUS_COLORS[status];
  const meta = DEADLINE_META[deadline.kind];
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.top}>
        <ProgressRing progress={urgency(deadline, today)} color={tone.fg} size={52} stroke={4}>
          <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
            <Icon name={meta.icon} size={21} color={meta.color} />
          </View>
        </ProgressRing>
        <View style={styles.titles}>
          {plate ? <Text style={styles.plate}>{plate}</Text> : null}
          <Text style={styles.title} numberOfLines={1}>
            {deadline.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {deadline.subtitle}
          </Text>
        </View>
        <View style={styles.when}>
          <View style={[styles.pill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.pillText, { color: tone.fg }]}>{deadlineBadge(deadline, today)}</Text>
          </View>
          <Text style={styles.date}>{deadlineDateText(deadline)}</Text>
        </View>
      </View>
      {onComplete ? (
        <View style={styles.actions}>
          <Button small variant="secondary" icon="check" title={COMPLETE_LABEL[deadline.kind]} onPress={onComplete} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 12,
    gap: 10,
    ...shadow,
  },
  pressed: {
    opacity: 0.85,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: {
    flex: 1,
    gap: 1,
  },
  plate: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
  },
  when: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  date: {
    fontSize: 11,
    color: colors.muted,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
