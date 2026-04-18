import axios from 'axios';
import Config from 'react-native-config';
import {getLanguagePreference} from '../hooks/useUsageTracker';
import {sanitizeTranscript} from './transcribe';

const GROQ_API_KEY = Config.GROQ_API_KEY;
const GROQ_CHAT_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export interface SummaryResult {
  fullSummary: string;
  fullTranslation: string; // The complete polished message
  bullets: string[];
  readSeconds: number;
}

/**
 * Maps user language preference code → human label for the LLM prompt.
 *
 * IMPORTANT: 'ur' maps to 'Urdu' (Arabic/Nastaliq script) — NOT Roman Urdu.
 * The transcription from Whisper arrives in Roman/Latin script.
 * The LLM's job is to translate that into proper Urdu Nastaliq,
 * exactly like the reference app in Image 2.
 */
const LANG_LABELS: Record<string, string> = {
  auto: 'the same primary language used in the voice note',
  ur:   'Roman Urdu', // Latin-script Urdu e.g. "bhai yeh karo"
  en:   'English',
  ar:   'Arabic',
  hi:   'Hindi',
  tr:   'Turkish',
  fr:   'French',
  de:   'German',
};

/**
 * Per-language script enforcement rules for the LLM.
 * These are injected directly into the prompt so the model
 * cannot accidentally switch scripts.
 */
const LANG_SCRIPT_RULES: Record<string, string> = {
  ur:   'Write ONLY in Roman Urdu (Latin letters a-z). Do NOT use Urdu/Arabic script (ا، ب، پ). Example: "Bhai ne kaha ke kaam kal tak khatam ho jayega."',
  ar:   'Write ONLY in Arabic script. Do NOT romanize.',
  hi:   'Write ONLY in Hindi Devanagari script (अ, ब, क...). Do NOT romanize.',
  en:   'Write ONLY in English.',
  tr:   'Write ONLY in Turkish.',
  fr:   'Write ONLY in French.',
  de:   'Write ONLY in German.',
  auto: 'Detect the language of the transcript and write ONLY in its native script. Do NOT romanize.',
};

/**
 * Detects if the LLM accidentally wrote Roman Urdu instead of Nastaliq Urdu.
 * Returns true if output is VALID (contains Urdu/Arabic script as expected).
 */
const ARABIC_URDU_SCRIPT_REGEX =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Detects non-Latin scripts — used to validate English-only output.
 */
const NON_LATIN_SCRIPT_REGEX =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0900-\u097F]/;

function validateOutputLanguage(result: SummaryResult, langCode: string): boolean {
  const allText = [result.fullSummary, ...result.bullets].join(' ');

  if (langCode === 'ur') {
    // Roman Urdu MUST NOT contain Arabic/Urdu Nastaliq characters
    if (ARABIC_URDU_SCRIPT_REGEX.test(allText)) {
      console.log('Validation fail: ur output contains Nastaliq script (should be Roman)');
      return false;
    }
  }

  if (langCode === 'en' || langCode === 'auto') {
    // English output must NOT contain Arabic/Urdu or Devanagari
    if (NON_LATIN_SCRIPT_REGEX.test(allText)) {
      console.log('Validation fail: en/auto output contains non-Latin script');
      return false;
    }
  }

  return true;
}

/**
 * If LLM output fails script validation, retry once with a stricter prompt.
 */
async function retryWithCorrection(
  result: SummaryResult,
  cleanTranscript: string,
  langCode: string,
  token: string,
): Promise<SummaryResult> {
  const isValid = validateOutputLanguage(result, langCode);
  if (isValid) {
    console.log('Output validation passed');
    return result;
  }

  console.log('Output validation failed — retrying with correction prompt');

  const langLabel = LANG_LABELS[langCode] ?? 'English';
  const scriptRule = LANG_SCRIPT_RULES[langCode] ?? LANG_SCRIPT_RULES.auto;

  const correctionPrompt = `Your previous output was in the wrong script. You MUST rewrite in ${langLabel} only.

CRITICAL RULE: ${scriptRule}

Original transcript (may be in Roman/mixed script):
"${cleanTranscript}"

Translate the complete message into ${langLabel} in THIRD PERSON — describe what the sender is saying, starting with "This person is saying..." or its equivalent in ${langLabel}. Return ONLY this JSON:
{
  "fullSummary": "third-person summary of the complete message in ${langLabel}",
  "fullTranslation": "complete third-person translation of the message in ${langLabel}",
  "bullets": ["point 1", "point 2", "point 3"],
  "readSeconds": 8
}`;

  try {
    const retryResponse = await axios.post<{
      choices: {message: {content: string}}[];
    }>(
      GROQ_CHAT_ENDPOINT,
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a multilingual translator. You ALWAYS respond in valid JSON only. You ALWAYS write in the exact script requested. You NEVER mix languages or scripts. You ALWAYS write in third person, describing what the sender is saying.`,
          },
          {role: 'user', content: correctionPrompt},
        ],
        max_tokens: 1024,
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      },
    );

    const retryContent = retryResponse.data?.choices?.[0]?.message?.content ?? '';
    console.log('--- Retry LLM Response ---');
    console.log(retryContent.slice(0, 500));
    console.log('--------------------------');

    const retryParsed = parseResponse(retryContent);
    if (retryParsed) {
      if (!validateOutputLanguage(retryParsed, langCode)) {
        console.log('Still wrong script after retry — returning best attempt');
      }
      return retryParsed;
    }
  } catch (e: any) {
    console.log('Retry call failed:', e?.message ?? e);
  }

  return result;
}

/**
 * Light sanitization before sending to LLM.
 * Only removes noise — does NOT remove meaningful filler words
 * because those are part of the spoken message.
 */
function sanitizeForLLM(transcript: string): string {
  let text = sanitizeTranscript(transcript);

  // Remove pure English filler sounds (no semantic content)
  text = text.replace(/\b(uh+|um+|hmm+|er+)\b/gi, '');

  // Collapse extra whitespace left after removal
  text = text.replace(/([,.])\s*([,.])+/g, '$1');
  text = text.replace(/\s{2,}/g, ' ').trim();

  return text;
}

function buildPrompt(transcript: string, langCode: string, durationSeconds?: number): string {
  const langLabel = LANG_LABELS[langCode] ?? 'English';
  const scriptRule = LANG_SCRIPT_RULES[langCode] ?? LANG_SCRIPT_RULES.auto;

  // Threshold: 3 minutes = 180 seconds
  const isLongAudio = durationSeconds && durationSeconds > 180;

  const mainTask = isLongAudio
    ? `2. SUMMARIZE the following transcript in ${langLabel}. Write in THIRD PERSON — as if you are describing what the sender is saying to someone else. Start with a phrase like "This person is saying..." or "The sender mentions..." or the equivalent in ${langLabel}. Capture the main purpose, all key requests, names, and numbers, but keep it concise and natural.`
    : `2. Translate the ENTIRE message into ${langLabel} — word for word, sentence for sentence. Write in THIRD PERSON — as if you are describing what the sender is saying. Start with a phrase like "This person is saying..." or "The sender mentions..." or the equivalent in ${langLabel}. Keep the natural conversational tone. Do NOT shorten, condense, or omit anything.`;

  const lengthRule = isLongAudio
    ? `- fullSummary must be a concise third-person summary of the message in ${langLabel}, starting with "This person is saying..." or its equivalent
- fullTranslation must be the COMPLETE third-person translation — every sentence present, natural tone`
    : `- fullSummary must be the COMPLETE third-person translation — every sentence present, starting with "This person is saying..." or its equivalent in ${langLabel}
- fullTranslation should be the same as fullSummary`;

  return `You are a voice message translator. The transcript below was recorded by a South Asian speaker and may be in Punjabi, Urdu, Roman Urdu, Hindi, or a mix of these with English.

TARGET LANGUAGE: ${langLabel}
SCRIPT RULE: ${scriptRule}

YOUR JOB:
1. Read the full transcript and understand what the speaker is saying.
${mainTask}
3. Write exactly 3 bullet points in ${langLabel} capturing the key things the sender is asking or saying. Max 12 words per bullet. Bullets must also be in third person (e.g. "He wants..." / "She is asking..." or equivalent).

RULES:
${lengthRule}
- ${scriptRule}
- ALWAYS write in third person. Never use "I", "me", "my", "we". Use "this person", "the sender", "he", "she", or "they" instead.
- Preserve all names, numbers, app names, and places exactly as spoken
- If a word is unclear, infer from context — do not leave gaps
- Return ONLY valid JSON. No markdown, no explanation, nothing outside the JSON block.

Transcript:
"${transcript}"

JSON structure to return (use EXACTLY these key names):
{
  "fullSummary": "third-person summary in ${langLabel}",
  "fullTranslation": "COMPLETE third-person translation in ${langLabel}",
  "bullets": ["key point 1 in third person in ${langLabel}", "key point 2 in third person in ${langLabel}", "key point 3 in third person in ${langLabel}"]
}`;
}

/**
 * Programmatically estimate reading time instead of letting LLM hallucinate.
 * Average reading speed: 180 WPM = 3 words per second.
 */
function calculateReadSeconds(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 3));
}

function parseResponse(raw: string): SummaryResult | null {
  const stripped = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed: {
      fullSummary?: string;
      fullTranslation?: string;
      bullets: string[];
    } = JSON.parse(match[0]);

    const text = parsed.fullSummary ?? parsed.fullTranslation ?? '';
    const fullText = parsed.fullTranslation ?? text;

    if (
      typeof text === 'string' &&
      text.length > 0 &&
      Array.isArray(parsed.bullets) &&
      parsed.bullets.length > 0
    ) {
      return {
        fullSummary: text,
        fullTranslation: fullText,
        bullets: parsed.bullets.slice(0, 3),
        readSeconds: calculateReadSeconds(text),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function fallback(transcript: string): SummaryResult {
  const sentences = transcript
    .split(/[.!?।]+/)
    .map(s => s.trim())
    .filter(Boolean);

  return {
    fullSummary: transcript,
    fullTranslation: transcript,
    bullets:
      sentences.slice(0, 3).length > 0
        ? sentences.slice(0, 3)
        : [transcript.slice(0, 80)],
    readSeconds: calculateReadSeconds(transcript),
  };
}

export async function summarize(
  transcript: string,
  durationSeconds?: number,
): Promise<SummaryResult> {
  const langCode = getLanguagePreference();
  const token = GROQ_API_KEY ?? '';

  console.log('--- Summarize Start ---');
  console.log('Language:', langCode);
  console.log('Audio Duration:', durationSeconds != null ? `${durationSeconds}s` : 'unknown');
  console.log('Transcript length (raw):', transcript.length);

  const cleanTranscript = sanitizeForLLM(transcript);
  console.log('Transcript length (clean):', cleanTranscript.length);
  console.log('Clean snippet:', cleanTranscript.slice(0, 300));

  if (!token) {
    console.log('GROQ_API_KEY missing — using fallback');
    return fallback(cleanTranscript);
  }

  if (!cleanTranscript) {
    console.log('Empty transcript after sanitization — using fallback');
    return fallback(transcript);
  }

  try {
    const response = await axios.post<{
      choices: {message:{content: string}}[];
    }>(
      GROQ_CHAT_ENDPOINT,
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a precise multilingual translator. You ALWAYS respond in valid JSON only. You ALWAYS write in the exact language and script specified in the user prompt. You ALWAYS write in third person — never use "I", "me", or "my". You NEVER mix languages or scripts in your output.`,
          },
          {
            role: 'user',
            content: buildPrompt(cleanTranscript, langCode, durationSeconds),
          },
        ],
        max_tokens: 2048,
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const content = response.data?.choices?.[0]?.message?.content ?? '';

    console.log('--- LLM Response ---');
    console.log(content.slice(0, 800));
    console.log('--------------------');

    const parsed = parseResponse(content);
    if (parsed) {
      return await retryWithCorrection(parsed, cleanTranscript, langCode, token);
    }

    console.log('JSON parse failed — using fallback');
    return fallback(cleanTranscript);
  } catch (e: any) {
    console.log('Summarize API failed:', e?.response?.data ?? e?.message ?? e);
    return fallback(cleanTranscript);
  }
}