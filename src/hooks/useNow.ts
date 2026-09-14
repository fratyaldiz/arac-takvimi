import { useEffect, useState } from 'react';

/** Belirli aralıklarla güncellenen şimdiki zaman (geri sayımlar için). */
export function useNow(intervalMs: number, enabled = true): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!enabled) return;
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, enabled]);
  return now;
}
