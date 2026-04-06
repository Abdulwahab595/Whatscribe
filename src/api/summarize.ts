import axios from 'axios';
import Config from 'react-native-config';
import {getLanguagePreference} from '../hooks/useUsageTracker';
const HUGGINGFACE_API_TOKEN = Config.HUGGINGFACE_API_TOKEN;

const SUMMARIZE_ENDPOINT = 'https://router.huggingface.co/v1/chat/completions';
const SUMMARIZE_MODEL = 'meta-llama/Llama-3.1-8B-Instruct:cerebras';

export interface SummaryResult {
  bullets: string[];
  fullSummary: string;
  readSeconds: number;
}

// Language config: label + example output for the prompt
const LANG_CONFIG: Record<
  string,
  {label: string; b1: string; b2: string; b3: string; summary: string}
> = {
  auto: {
    label: 'Roman Urdu',
    b1: 'Shajra aur Fard Malkiyat chahiye',
    b2: 'Teen kanal ki Fard bhejna',
    b3: 'Khasra number Shajra pe likhna',
    summary:
      'Aapko apne zameen ke documents dene hain. Teen kanal ki Fard Malkiyat aur ek Shajra chahiye. Shajra mein Marbaa, Qila aur Khasra number zaroor mention karein.',
  },
  ur: {
    label: 'Roman Urdu',
    b1: 'Shajra aur Fard Malkiyat chahiye',
    b2: 'Teen kanal ki Fard bhejna',
    b3: 'Khasra number Shajra pe likhna',
    summary:
      'Aapko apne zameen ke documents dene hain. Teen kanal ki Fard Malkiyat aur ek Shajra chahiye. Shajra mein Marbaa, Qila aur Khasra number zaroor mention karein.',
  },
  en: {
    label: 'English',
    b1: 'Meeting is tomorrow morning',
    b2: 'Documents must be prepared',
    b3: 'Time set for 10 AM',
    summary:
      'There is an important meeting tomorrow at 10 AM. Documents need to be prepared in advance.',
  },
  ar: {
    label: 'Arabic',
    b1: 'الاجتماع غداً صباحاً',
    b2: 'يجب تحضير الوثائق',
    b3: 'الوقت المحدد الساعة 10',
    summary:
      'هناك اجتماع مهم غداً في الساعة العاشرة. يجب تحضير الوثائق مسبقاً.',
  },
  hi: {
    label: 'Hindi',
    b1: 'कल सुबह मीटिंग है',
    b2: 'दस्तावेज़ तैयार करने हैं',
    b3: 'समय सुबह 10 बजे',
    summary:
      'कल सुबह 10 बजे एक महत्वपूर्ण मीटिंग है। दस्तावेज़ पहले से तैयार रखना जरूरी है।',
  },
  tr: {
    label: 'Turkish',
    b1: 'Yarın sabah toplantı var',
    b2: 'Belgeler hazırlanmalı',
    b3: 'Saat 10 olarak belirlendi',
    summary:
      "Yarın sabah saat 10'da önemli bir toplantı var. Belgelerin önceden hazırlanması gerekiyor.",
  },
  fr: {
    label: 'French',
    b1: 'Réunion demain matin',
    b2: 'Documents à préparer',
    b3: 'Heure fixée à 10h',
    summary:
      "Il y a une réunion importante demain à 10h. Les documents doivent être préparés à l'avance.",
  },
  de: {
    label: 'German',
    b1: 'Morgen früh ist Meeting',
    b2: 'Dokumente vorbereiten',
    b3: 'Uhrzeit auf 10 Uhr festgelegt',
    summary:
      'Morgen um 10 Uhr findet ein wichtiges Meeting statt. Die Dokumente müssen vorher vorbereitet werden.',
  },
};

function buildSystemPrompt(langCode: string): string {
  const cfg = LANG_CONFIG[langCode] ?? LANG_CONFIG.auto;
  const exampleJson = JSON.stringify({
    bullets: [cfg.b1, cfg.b2, cfg.b3],
    fullSummary: cfg.summary,
    readSeconds: 6,
  });
  return (
    `You are a voice note summarizer. Always respond in ${cfg.label} only — never copy the language of the transcript.\n\n` +
    `Rules:\n` +
    `- Treat repeated phrases as ONE point. Do not duplicate bullet content.\n` +
    `- PRESERVE specific names, document terms, numbers exactly (e.g. Shajra, Fard Malkiyat, Khasra, 3 kanal).\n` +
    `- Be specific, not vague. Say WHAT was said, not just the topic.\n` +
    `- Bullets: EXACTLY 3, max 10 words each. fullSummary: 2-3 sentences, no repeated points.\n` +
    `- Return ONLY valid JSON: { "bullets": ["...","...","..."], "fullSummary": "...", "readSeconds": N }\n` +
    `- Every string in ${cfg.label}. No markdown, no text outside JSON.\n\n` +
    `Example:\n${exampleJson}`
  );
}

function buildUserPrompt(transcript: string, langCode: string): string {
  const cfg = LANG_CONFIG[langCode] ?? LANG_CONFIG.auto;
  return `Summarize this voice note transcript in ${cfg.label}. Return only JSON.\n\nTranscript: ${transcript}`;
}

function fallback(transcript: string): SummaryResult {
  const sentences = transcript
    .split(/[.!?।]+/)
    .map(s => s.trim())
    .filter(Boolean);
  return {
    bullets: sentences.slice(0, 3),
    fullSummary: sentences.slice(0, 5).join('. '),
    readSeconds: 5,
  };
}

function parseJson(raw: string): SummaryResult | null {
  const stripped = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed: {
      bullets: string[];
      fullSummary: string;
      readSeconds: number;
    } = JSON.parse(match[0]);
    if (
      Array.isArray(parsed.bullets) &&
      typeof parsed.fullSummary === 'string' &&
      typeof parsed.readSeconds === 'number'
    ) {
      return {
        bullets: parsed.bullets.slice(0, 3),
        fullSummary: parsed.fullSummary,
        readSeconds: parsed.readSeconds,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function summarize(transcript: string): Promise<SummaryResult> {
  const langCode = getLanguagePreference();
  console.log('--- Summarizing Transcript ---');
  console.log(transcript);
  console.log('language:', langCode);
  try {
    const token = HUGGINGFACE_API_TOKEN ?? '';
    const response = await axios.post<{
      choices: {message: {content: string}}[];
    }>(
      SUMMARIZE_ENDPOINT,
      {
        model: SUMMARIZE_MODEL,
        messages: [
          {role: 'system', content: buildSystemPrompt(langCode)},
          {role: 'user', content: buildUserPrompt(transcript, langCode)},
        ],
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const generated = response.data?.choices?.[0]?.message?.content ?? '';

    console.log('--- Mistral Response ---');
    console.log(generated);
    console.log('------------------------');

    const parsed = parseJson(generated);
    if (parsed) return parsed;
    return fallback(transcript);
  } catch (e) {
    console.log('Summarization API call failed:', e);
    return fallback(transcript);
  }
}
