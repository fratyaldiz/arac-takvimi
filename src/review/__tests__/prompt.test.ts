import {
  EMPTY_REVIEW_STATE,
  MIN_DAYS_BETWEEN_PROMPTS,
  MIN_LAUNCHES,
  shouldAskForReview,
  type ReviewState,
} from '../prompt';

const TODAY = '2026-10-20';

function ready(overrides: Partial<ReviewState> = {}): ReviewState {
  return { ...EMPTY_REVIEW_STATE, launches: MIN_LAUNCHES, firstLaunch: '2026-10-01', ...overrides };
}

describe('puan isteme zamanı', () => {
  it('yeterli kullanım sonrası sorulur', () => {
    expect(shouldAskForReview(ready(), TODAY, '1.1.0')).toBe(true);
  });

  it('ilk günlerde sorulmaz', () => {
    expect(shouldAskForReview(ready({ firstLaunch: '2026-10-18' }), TODAY, '1.1.0')).toBe(false);
  });

  it('az açılışta sorulmaz', () => {
    expect(shouldAskForReview(ready({ launches: MIN_LAUNCHES - 1 }), TODAY, '1.1.0')).toBe(false);
  });

  it('aynı sürümde ikinci kez sorulmaz', () => {
    expect(shouldAskForReview(ready({ lastPromptVersion: '1.1.0', lastPrompt: '2026-10-02' }), TODAY, '1.1.0')).toBe(false);
  });

  it('yeni sürümde bile çok erken sorulmaz', () => {
    const state = ready({ lastPromptVersion: '1.0.0', lastPrompt: '2026-10-15' });
    expect(shouldAskForReview(state, TODAY, '1.1.0')).toBe(false);
  });

  it('aradan yeterli gün geçince yeni sürümde sorulur', () => {
    const state = ready({ lastPromptVersion: '1.0.0', lastPrompt: '2026-01-01' });
    expect(shouldAskForReview(state, TODAY, '1.1.0')).toBe(true);
    expect(MIN_DAYS_BETWEEN_PROMPTS).toBeGreaterThan(90);
  });

  it('kullanıcı kapattıysa bir daha sorulmaz', () => {
    expect(shouldAskForReview(ready({ dismissed: true }), TODAY, '1.1.0')).toBe(false);
  });

  it('ilk açılış kaydı yoksa sorulmaz', () => {
    expect(shouldAskForReview(ready({ firstLaunch: null }), TODAY, '1.1.0')).toBe(false);
  });
});
