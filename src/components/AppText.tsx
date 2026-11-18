import type { ReactNode } from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { useT } from '../i18n/store';

/**
 * Metni seçili dile çeviren Text. Ekranlarda react-native'in Text'i yerine
 * bu kullanılır; böylece her metni tek tek sarmaya gerek kalmaz. Sözlükte
 * karşılığı olmayan metin (ör. hesaplanmış "12 gün") Türkçe kalır.
 */
export function Text({ children, ...rest }: TextProps) {
  const t = useT();
  const translate = (node: ReactNode): ReactNode => (typeof node === 'string' ? t(node) : node);
  const content = Array.isArray(children) ? children.map(translate) : translate(children);
  return <RNText {...rest}>{content}</RNText>;
}
