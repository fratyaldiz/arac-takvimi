import { daysBetween, type ISODate } from '../utils/date';

/** Puan istemeden önce beklenen açılış sayısı. */
export const MIN_LAUNCHES = 4;
/** İlk açılıştan sonra beklenen gün. */
export const MIN_DAYS_INSTALLED = 5;
/** Aynı kullanıcıya iki istek arasındaki en az gün farkı. */
export const MIN_DAYS_BETWEEN_PROMPTS = 120;

export interface ReviewState {
  launches: number;
  firstLaunch: ISODate | null;
  lastPrompt: ISODate | null;
  /** Son istek hangi uygulama sürümünde yapıldı; her sürümde en fazla bir kez. */
  lastPromptVersion: string | null;
  /** Kullanıcı "zaten puan verdim" dediyse bir daha sorulmaz. */
  dismissed: boolean;
}

export const EMPTY_REVIEW_STATE: ReviewState = {
  launches: 0,
  firstLaunch: null,
  lastPrompt: null,
  lastPromptVersion: null,
  dismissed: false,
};

/**
 * Puan istemenin uygun olup olmadığı. İstek yalnız kullanıcı işini bitirdiği
 * olumlu bir andan sonra (ör. son tarihi "yapıldı" işaretleyince) sorulur;
 * uygulamayı açar açmaz sorulmaz.
 */
export function shouldAskForReview(state: ReviewState, today: ISODate, version: string): boolean {
  if (state.dismissed) return false;
  if (state.launches < MIN_LAUNCHES) return false;
  if (!state.firstLaunch || daysBetween(state.firstLaunch, today) < MIN_DAYS_INSTALLED) return false;
  if (state.lastPromptVersion === version) return false;
  if (state.lastPrompt && daysBetween(state.lastPrompt, today) < MIN_DAYS_BETWEEN_PROMPTS) return false;
  return true;
}
