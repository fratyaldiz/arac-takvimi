import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';

/** Gradyan başlıklı sekmelerde açık, düz başlıklı ekranlarda koyu durum çubuğu. */
export function useStatusBar(style: 'light' | 'dark') {
  useFocusEffect(
    useCallback(() => {
      // 'dark' isteyen ekranlar temaya göre değişir; gradyan başlıklar hep açık.
      setStatusBarStyle(style === 'dark' ? 'auto' : 'light');
    }, [style]),
  );
}
