import RNBlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import Config from 'react-native-config';

const GROQ_TRANSCRIBE_ENDPOINT =
  'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_API_KEY = Config.GROQ_API_KEY;

console.log('Groq Token loaded:', GROQ_API_KEY ? 'YES' : 'NO — check .env');

/**
 * Language → Whisper BCP-47 code.
 *
 * KEY DECISION — 'ur' is null (auto-detect):
 * South Asian speakers mix Punjabi / Saraiki / Roman Urdu freely.
 * Forcing lang='ur' causes Whisper (turbo and large-v3) to discard
 * non-Urdu phonemes mid-sentence and truncate the transcript.
 * Auto-detect lets Whisper pick the closest model branch per segment,
 * giving a complete transcript that the LLM then translates.
 */
const WHISPER_LANG_MAP: Record<string, string | null> = {
  auto: null, // pure auto-detect
  ur:   null, // auto-detect — do NOT force 'ur'; see note above
  en:   'en',
  ar:   'ar',
  hi:   'hi',
  tr:   'tr',
  fr:   'fr',
  de:   'de',
};

/**
 * Whisper prompt hints.
 * For South Asian languages we deliberately write the prompt in Roman script
 * so Whisper doesn't commit to Nastaliq output at the transcription stage —
 * script conversion is handled later by the LLM in summarize.ts.
 */
function buildWhisperPrompt(langCode: string): string {
  switch (langCode) {
    case 'ur':
      // Roman-script hint → Whisper stays in Latin/mixed mode → complete transcript
      // Name seeds prevent Whisper from mapping South Asian names to famous Western names
      // e.g. "Asad" → "Assad", "Umer" → "Omar", "Bilal" → "Bill"
      return 'This audio is from a South Asian speaker. It may contain Punjabi, Urdu, Saraiki, Roman Urdu, or English. Common words: bhai, karo, bhejo, account, app, screen shot, download, theek hai, haan, matlab. Common names: Asad, Usman, Bilal, Hamza, Umer, Ali, Hassan, Zain, Saad, Raza, Ayesha, Fatima, Sana, Nida, Hira. Transcribe every word exactly as spoken. Do not skip or truncate any part.';
    case 'en':
      return 'This audio is in English. Transcribe all spoken words accurately, including names and numbers.';
    case 'ar':
      return 'هذا الصوت باللغة العربية. يرجى كتابة الكلمات المنطوقة بدقة.';
    case 'hi':
      return 'यह ऑडियो हिंदी में है। बोले गए शब्दों को सटीक रूप से लिखें, नाम और स्थान सहित।';
    case 'tr':
      return 'Bu ses Türkçedir. Konuşulan kelimeleri doğru bir şekilde yazın.';
    case 'fr':
      return 'Cet audio est en français. Transcrivez les mots prononcés avec précision.';
    case 'de':
      return 'Dieses Audio ist auf Deutsch. Schreiben Sie die gesprochenen Wörter genau auf.';
    default:
      return 'This audio may be in Punjabi, Urdu, Hindi, English, or a regional language mix. Transcribe the actual spoken words accurately including all regional language words as spoken. Do not skip or truncate any part.';
  }
}

/**
 * Choose Whisper model based on language.
 * whisper-large-v3       → better multilingual accuracy, handles South Asian dialects
 * whisper-large-v3-turbo → faster, fine for single-language audio (EN/AR/HI/TR/FR/DE)
 */
function getWhisperModel(langCode: string): string {
  if (langCode === 'ur' || langCode === 'auto') {
    return 'whisper-large-v3';
  }
  return 'whisper-large-v3-turbo';
}

/**
 * Dynamic API timeout based on audio duration.
 *
 * Groq processes audio at roughly 10–15x real-time for large-v3,
 * but network latency + queue adds 5–15s overhead.
 * Generous headroom ensures long voice notes never time out.
 *
 * Duration unknown → 60s default (safe for most clips up to ~3 min).
 */
function getTimeoutMs(durationSeconds?: number): number {
  if (!durationSeconds)        return 300_000;  // unknown       → 5 mins default
  if (durationSeconds <= 60)   return 180_000;  // ≤1 min        → 3 mins
  if (durationSeconds <= 180)  return 300_000;  // ≤3 min        → 5 mins
  if (durationSeconds <= 300)  return 420_000;  // ≤5 min        → 7 mins
  return 600_000;                               // >5 min        → 10 mins max
}

/**
 * Removes Whisper hallucination artifacts from the raw transcript.
 */
export function sanitizeTranscript(raw: string): string {
  let text = raw;

  // Remove known Whisper hallucination markers
  text = text.replace(/\[BLANK_AUDIO\]/gi, '');
  text = text.replace(/\[.*?MUSIC.*?\]/gi, '');
  text = text.replace(/\(.*?[Mm]usic.*?\)/g, '');
  text = text.replace(/♪[^♪]*♪/g, '');
  text = text.replace(/♪/g, '');
  text = text.replace(/\[.*?\]/g, '');

  // Remove timestamps whisper sometimes injects
  text = text.replace(
    /\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}/g,
    '',
  );

  // Remove repeated words (2+ repetitions in a row)
  text = text.replace(/\b(\w+)(\s+\1){1,}/gi, '$1');

  // Remove repeated short phrases (2+ repetitions)
  text = text.replace(/(.{4,40})(\s*\1){1,}/gi, '$1');

  // Collapse multiple spaces/newlines
  text = text.replace(/\s{2,}/g, ' ').trim();

  // Remove lines that are only punctuation or whitespace
  text = text.replace(/^[\s.,!?;:]+$/gm, '').trim();

  return text;
}

function getExtension(uri: string, mimeType?: string | null): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.m4a')) return 'm4a';
  if (lower.endsWith('.mp3')) return 'mp3';
  if (lower.endsWith('.flac')) return 'flac';
  if (lower.endsWith('.wav')) return 'wav';
  if (lower.endsWith('.mp4')) return 'mp4';
  if (lower.endsWith('.webm')) return 'webm';
  if (mimeType?.includes('mp4') || mimeType?.includes('m4a')) return 'm4a';
  if (mimeType?.includes('mpeg')) return 'mp3';
  if (mimeType?.includes('flac')) return 'flac';
  if (mimeType?.includes('wav')) return 'wav';
  return 'ogg';
}

function getAudioMime(ext: string): string {
  if (ext === 'm4a' || ext === 'mp4') return 'audio/mp4';
  if (ext === 'mp3') return 'audio/mpeg';
  if (ext === 'flac') return 'audio/flac';
  if (ext === 'wav') return 'audio/wav';
  return 'audio/ogg';
}

async function resolveToLocalPath(
  uri: string,
  mimeType?: string | null,
): Promise<{path: string; isTemp: boolean}> {
  if (!uri) throw new Error('Audio URI is null or undefined');
  if (uri.startsWith('content://')) {
    const ext = getExtension(uri, mimeType);
    const tempPath = `${RNFS.CachesDirectoryPath}/temp_audio_${Date.now()}.${ext}`;
    await RNFS.copyFile(uri, tempPath);
    return {path: tempPath, isTemp: true};
  }
  return {path: uri.replace('file://', ''), isTemp: false};
}

export async function transcribe(
  audioUri: string,
  mimeType?: string | null,
  onRetrying?: () => void,
  langCode: string = 'auto',
  audioDurationSeconds?: number,
): Promise<string> {
  if (!audioUri) throw new Error('Audio URI is null or undefined');

  const token = GROQ_API_KEY ?? '';
  if (!token) throw new Error('GROQ_API_KEY missing from .env');

  const {path: localPath, isTemp} = await resolveToLocalPath(audioUri, mimeType);
  const ext = getExtension(audioUri, mimeType);
  const audioMime = getAudioMime(ext);
  const whisperLang = WHISPER_LANG_MAP[langCode] ?? null;
  const whisperPrompt = buildWhisperPrompt(langCode);
  const whisperModel = getWhisperModel(langCode);
  const timeoutMs = getTimeoutMs(audioDurationSeconds);

  console.log('--- Transcription Debug ---');
  console.log('Local Path:', localPath);
  console.log('Extension:', ext);
  console.log('MIME:', audioMime);
  console.log('Language Code:', langCode);
  console.log('Whisper Model:', whisperModel);
  console.log('Whisper Language:', whisperLang ?? 'auto-detect');
  console.log('Audio Duration:', audioDurationSeconds != null ? `${audioDurationSeconds}s` : 'unknown');
  console.log('API Timeout set to:', `${timeoutMs / 1000}s`);

  try {
    const formFields: any[] = [
      {
        name: 'file',
        filename: `audio.${ext}`,
        type: audioMime,
        data: RNBlobUtil.wrap(localPath),
      },
      {name: 'model',           data: whisperModel},
      {name: 'response_format', data: 'json'},
      {name: 'temperature',     data: '0'},
      {name: 'prompt',          data: whisperPrompt},
    ];

    // Only pass 'language' when explicitly set — never for ur/auto
    if (whisperLang) {
      formFields.push({name: 'language', data: whisperLang});
    }

    const response = await RNBlobUtil.config({
      timeout: timeoutMs,
    }).fetch(
      'POST',
      GROQ_TRANSCRIBE_ENDPOINT,
      {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      formFields,
    );

    const status = response.respInfo.status;
    const responseText = await response.text();

    console.log('Groq Status:', status);
    console.log('Groq Response:', responseText.slice(0, 500));

    let data: {text?: string; error?: {message?: string} | string} = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Groq returned non-JSON: ${responseText.slice(0, 100)}`);
    }

    if (status === 429) throw new Error('Rate limit reached. Please wait a moment and try again.');
    if (status === 401) throw new Error('Invalid Groq API key. Check your .env file.');
    if (status === 413) throw new Error('Audio file is too large. Max size is 25MB.');
    if (status < 200 || status >= 300) {
      const detail =
        typeof data?.error === 'object'
          ? data.error?.message
          : data?.error ?? 'Unknown error';
      throw new Error(`Transcription failed (${status}): ${detail}`);
    }

    const rawTranscript = (data?.text ?? '').trim();
    if (!rawTranscript) throw new Error('Empty transcript returned from Groq');

    console.log('--- Raw Transcript (before sanitize) ---');
    console.log(rawTranscript);

    const cleanTranscript = sanitizeTranscript(rawTranscript);

    console.log('--- Clean Transcript (after sanitize) ---');
    console.log(cleanTranscript);
    console.log('-----------------------------------------');

    if (!cleanTranscript) {
      throw new Error('Transcript was empty after sanitization');
    }

    return cleanTranscript;
  } finally {
    if (isTemp) {
      RNFS.unlink(localPath).catch(() => {});
    }
  }
}