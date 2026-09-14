import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function PlateBadge({ plate, large }: { plate: string; large?: boolean }) {
  return (
    <View style={styles.plate}>
      <View style={styles.strip}>
        <Text style={styles.tr}>TR</Text>
      </View>
      <Text style={[styles.text, large && styles.textLarge]} numberOfLines={1}>
        {plate}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#111111',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  strip: {
    backgroundColor: colors.plateBlue,
    paddingHorizontal: 4,
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  tr: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  text: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#111111',
  },
  textLarge: {
    fontSize: 22,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
});
