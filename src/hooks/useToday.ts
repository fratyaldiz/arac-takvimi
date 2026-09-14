import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { todayISO, type ISODate } from '../utils/date';

/** Uygulama arka plandan dönünce günü tazeler; gece açık kalan uygulama eski günde takılmaz. */
export function useToday(): ISODate {
  const [today, setToday] = useState(todayISO());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(todayISO());
    });
    return () => sub.remove();
  }, []);
  return today;
}
