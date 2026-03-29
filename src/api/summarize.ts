import axios from 'axios';
import Config from 'react-native-config';

const SUMMARIZE_ENDPOINT =
  'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1';

export interface SummaryResult {
  bullets: string[];
  readSeconds: number;
}

function buildPrompt(transcript: string): string {
  return (
    `[INST] Given this voice note transcript, respond ONLY with valid JSON, no explanation:\n` +
    `Transcript: ${transcript}\n` +
    `Return: { "bullets": ["point1", "point2", "point3"], "readSeconds": 5 }\n` +
    `Max 3 bullets, each under 10 words. readSeconds = estimated seconds to read the bullets. [/INST]`
  );
}

function fallback(transcript: string): SummaryResult {
  const sentences = transcript
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(Boolean);
  const bullets = sentences.slice(0, 3);
  return { bullets, readSeconds: 5 };
}

function parseJson(raw: string): SummaryResult | null {
  // Strip markdown code fences if present
  const stripped = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // Find first JSON object in the response
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed: { bullets: string[]; readSeconds: number } = JSON.parse(
      match[0],
    );
    if (
      Array.isArray(parsed.bullets) &&
      typeof parsed.readSeconds === 'number'
    ) {
      return { bullets: parsed.bullets, readSeconds: parsed.readSeconds };
    }
    return null;
  } catch {
    return null;
  }
}

export async function summarize(transcript: string): Promise<SummaryResult> {
  try {
    const token = Config.HUGGINGFACE_API_TOKEN ?? '';
    const response = await axios.post<{ generated_text: string }[]>(
      SUMMARIZE_ENDPOINT,
      { inputs: buildPrompt(transcript) },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const generated =
      Array.isArray(response.data) && response.data[0]?.generated_text
        ? response.data[0].generated_text
        : '';

    const parsed = parseJson(generated);
    if (parsed) return parsed;
    return fallback(transcript);
  } catch {
    return fallback(transcript);
  }
}
