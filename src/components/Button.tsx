import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'danger' | 'light';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  small?: boolean;
  icon?: IconName;
  disabled?: boolean;
}

const VARIANT: Record<Variant, { bg: string; fg: string }> = {
  primary: { bg: colors.primary, fg: '#FFFFFF' },
  secondary: { bg: colors.primarySoft, fg: colors.primary },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  light: { bg: '#FFFFFF', fg: colors.primary },
};

export function Button({ title, onPress, variant = 'primary', small, icon, disabled }: Props) {
  const { bg, fg } = VARIANT[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: bg },
        (pressed || disabled) && styles.pressed,
      ]}
    >
      {icon ? <Icon name={icon} size={small ? 16 : 20} color={fg} /> : null}
      <Text style={[styles.text, small && styles.smallText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  smallText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
