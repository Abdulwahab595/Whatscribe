import {MMKV} from 'react-native-mmkv';

const storage = new MMKV();

const USAGE_SECONDS_KEY = 'usage_seconds';
const PLAN_TYPE_KEY = 'plan_type';
const LANGUAGE_KEY = 'transcription_language';
const FREE_LIMIT = 99999; // TODO: set back to 180 before release

export function getRemainingSeconds(): number {
  const used = storage.getNumber(USAGE_SECONDS_KEY) ?? 0;
  return Math.max(0, FREE_LIMIT - used);
}

export function addUsage(seconds: number): void {
  const used = storage.getNumber(USAGE_SECONDS_KEY) ?? 0;
  storage.set(USAGE_SECONDS_KEY, used + seconds);
}

export function isFreeLimitReached(): boolean {
  const used = storage.getNumber(USAGE_SECONDS_KEY) ?? 0;
  const plan = (storage.getString(PLAN_TYPE_KEY) ?? 'free') as
    | 'free'
    | 'premium';
  return used >= FREE_LIMIT && plan === 'free';
}

export function getPlanType(): 'free' | 'premium' {
  return (storage.getString(PLAN_TYPE_KEY) ?? 'free') as 'free' | 'premium';
}

export function setPlanType(type: 'free' | 'premium'): void {
  storage.set(PLAN_TYPE_KEY, type);
}

export function resetUsage(): void {
  storage.set(USAGE_SECONDS_KEY, 0);
}

export function getUsageSeconds(): number {
  return storage.getNumber(USAGE_SECONDS_KEY) ?? 0;
}

// 'auto' = let Whisper detect, or a BCP-47 code like 'ur', 'en', 'ar'
export function getLanguagePreference(): string {
  return storage.getString(LANGUAGE_KEY) ?? 'auto';
}

export function setLanguagePreference(lang: string): void {
  storage.set(LANGUAGE_KEY, lang);
}
