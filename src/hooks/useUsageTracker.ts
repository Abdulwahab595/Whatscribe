import {MMKV} from 'react-native-mmkv';

const storage = new MMKV();

const USAGE_SECONDS_KEY = 'usage_seconds';
const PLAN_TYPE_KEY = 'plan_type';
const LANGUAGE_KEY = 'transcription_language';
const FREE_LIMIT = 180; // 3 minutes
const STARTER_LIMIT = 1200; // 20 minutes

export type PlanType = 'free' | 'starter' | 'premium';

export function getPlanLimit(plan: PlanType): number {
  if (plan === 'premium') return Infinity;
  if (plan === 'starter') return STARTER_LIMIT;
  return FREE_LIMIT;
}

export function getRemainingSeconds(audioDurationToTranscribe: number = 0): number {
  return Infinity; // TEMP: For testing purposes
  /*
  const plan = getPlanType();
  if (plan === 'premium') return Infinity;

  const limit = getPlanLimit(plan);
  const used = storage.getNumber(USAGE_SECONDS_KEY) ?? 0;
  // Use exact calculation here so UI can know if the new audio exceeds what's left
  return Math.max(0, limit - used - audioDurationToTranscribe);
  */
}

export function addUsage(seconds: number): void {
  const used = storage.getNumber(USAGE_SECONDS_KEY) ?? 0;
  storage.set(USAGE_SECONDS_KEY, used + seconds);
}

export function isFreeLimitReached(): boolean {
  const remaining = getRemainingSeconds();
  return remaining <= 0;
}

export function getPlanType(): PlanType {
  return (storage.getString(PLAN_TYPE_KEY) ?? 'free') as PlanType;
}

export function setPlanType(type: PlanType): void {
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
