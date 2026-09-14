import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';

/** Gradyan başlıklı sekmelerde açık, düz başlıklı ekranlarda koyu durum çubuğu. */
export function useStatusBar(style: 'light' | 'dark') {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style);
    }, [style]),
  );
}
