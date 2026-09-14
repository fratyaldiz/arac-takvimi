import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface Props<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string | number>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.item, active && styles.active]}
          >
            <Text style={[styles.text, active && styles.activeText]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  item: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  active: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  activeText: {
    color: colors.text,
    fontWeight: '600',
  },
});
