import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'transcription_history';

export interface HistoryEntry {
  id: string;
  audioUri: string;
  duration: number;
  transcript: string;
  bullets: string[];
  fullSummary: string;
  fullTranslation: string;
  readSeconds: number;
  createdAt: string;
}

export async function saveEntry(entry: HistoryEntry): Promise<void> {
  const existing = await getAllEntries();
  const updated = [entry, ...existing];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function getAllEntries(): Promise<HistoryEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed: HistoryEntry[] = JSON.parse(raw);
  return parsed.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function deleteEntry(id: string): Promise<void> {
  const existing = await getAllEntries();
  const updated = existing.filter(e => e.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
