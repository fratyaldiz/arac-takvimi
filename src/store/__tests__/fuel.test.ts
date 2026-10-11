import { FUEL_PRICE_TIMEOUT_MS } from '../../fuel/prices';
import { useFuelPrices } from '../fuel';

// Store AsyncStorage'a yazıyor; testte yerel taklidi kullanılır.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const PAYLOAD = { prices: [{ fuelType: 'Benzin', price: 82.14, date: '2026-10-10T00:00:00.000Z' }] };

function reset() {
  useFuelPrices.setState({ data: null, loading: false, error: null });
}

describe('yakıt fiyatı yenileme', () => {
  afterEach(() => {
    jest.useRealTimers();
    reset();
  });

  it('fiyatları çeker ve yüklemeyi kapatır', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => PAYLOAD }) as unknown as typeof fetch;
    await useFuelPrices.getState().refresh(true);
    expect(useFuelPrices.getState().data?.prices.benzin).toBe(82.14);
    expect(useFuelPrices.getState().loading).toBe(false);
    expect(useFuelPrices.getState().error).toBeNull();
  });

  it('hata sonrası yükleme kilitli kalmaz', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;
    await useFuelPrices.getState().refresh(true);
    expect(useFuelPrices.getState().loading).toBe(false);
    expect(useFuelPrices.getState().error).toMatch(/İnternet/);
  });

  it('asılı kalan istekten sonra elle yenileme yine çalışır', async () => {
    // Eski hata: loading true kalınca force dahil her yenileme sessizce dönüyordu.
    useFuelPrices.setState({ loading: true });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => PAYLOAD }) as unknown as typeof fetch;
    await useFuelPrices.getState().refresh(true);
    expect(global.fetch).toHaveBeenCalled();
    expect(useFuelPrices.getState().data?.prices.benzin).toBe(82.14);
  });

  it('zaman aşımında isteği iptal edip ayrı mesaj verir', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn(
      (_url: string, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    ) as unknown as typeof fetch;

    const pending = useFuelPrices.getState().refresh(true);
    jest.advanceTimersByTime(FUEL_PRICE_TIMEOUT_MS);
    await pending;

    expect(useFuelPrices.getState().loading).toBe(false);
    expect(useFuelPrices.getState().error).toMatch(/yanıt vermedi/);
  });

  it('taze veri varken force olmadan ağa çıkmaz', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => PAYLOAD }) as unknown as typeof fetch;
    await useFuelPrices.getState().refresh(true);
    (global.fetch as jest.Mock).mockClear();
    await useFuelPrices.getState().refresh();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
