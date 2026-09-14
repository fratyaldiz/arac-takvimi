import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../theme';
import { Icon, type IconName } from './Icon';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{title}</Text>
      {action ? (
        <Pressable hitSlop={8} onPress={action.onPress}>
          <Text style={styles.sectionAction}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function IconBadge({ icon, color, bg, size = 40 }: { icon: IconName; color: string; bg: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={Math.round(size * 0.52)} color={color} />
    </View>
  );
}

/** Sekme ekranlarının üstündeki gradyan başlık; durum çubuğunun altına taşar. */
export function GradientHero({ colors: gradient, children }: { colors: [string, string]; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + 18 }]}
    >
      {children}
    </LinearGradient>
  );
}

export function HeroStat({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.heroStat, pressed && styles.pressed]}>
      <Text style={styles.heroStatValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </Text>
      <Text style={styles.heroStatLabel} numberOfLines={1}>
        {label}
        {onPress ? ' ›' : ''}
      </Text>
    </Pressable>
  );
}

export function ChipRow<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  suffix?: string;
  keyboardType?: KeyboardTypeOptions;
  hint?: string;
  optional?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  suffix,
  keyboardType,
  hint,
  optional,
  autoCapitalize,
}: TextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {optional ? <Text style={styles.optional}> (isteğe bağlı)</Text> : null}
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          style={styles.input}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function ListRow({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  right,
  onPress,
}: {
  icon: IconName;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
      <IconBadge icon={icon} color={iconColor} bg={iconBg} size={44} />
      <View style={styles.listText}>
        <Text style={styles.listTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron-right" size={22} color={colors.muted} /> : null)}
    </Pressable>
  );
}

export function EmptyHint({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <Card style={styles.empty}>
      <IconBadge icon={icon} color={colors.primary} bg={colors.primarySoft} size={56} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action}
    </Card>
  );
}

export const screenStyles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '500',
  },
  heroBig: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    marginVertical: 2,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    ...shadow,
  },
  pressed: {
    opacity: 0.8,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  section: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionAction: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 2,
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  chips: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  optional: {
    fontWeight: '400',
    color: colors.muted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  suffix: {
    fontSize: 15,
    color: colors.muted,
    fontWeight: '600',
    marginLeft: 8,
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 14,
    ...shadow,
  },
  listText: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  listSubtitle: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
