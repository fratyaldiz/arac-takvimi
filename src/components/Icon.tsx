import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import type { ComponentProps } from 'react';

/** Material Design Icons glif adı; yanlış ad tip kontrolünde yakalanır. */
export type IconName = ComponentProps<typeof MaterialDesignIcons>['name'];

export function Icon({ name, size, color }: { name: IconName; size: number; color: string }) {
  return <MaterialDesignIcons name={name} size={size} color={color} />;
}
