import axios from 'axios';
// import Config from 'react-native-config';
const HUGGINGFACE_API_TOKEN='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'

const SUMMARIZE_ENDPOINT =
  'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1';

export interface SummaryResult {
  bullets: string[];
  readSeconds: number;
}

function buildPrompt(transcript: string): string {
  return (
    `[INST] Given this voice note transcript, translate to Roman Urdu and summarize into 3 short bullet points. Respond ONLY with valid JSON, no explanation:\n` +
    `Transcript: ${transcript}\n` +
    `Return: { "bullets": ["Gari 62k chali hui hai", "Ye 2022 ka model hai", "Price thori zyada hai"], "readSeconds": 5 }\n` +
    `Max 3 bullets, each under 10 words. Respond in ROMAN URDU only. readSeconds = estimated seconds to read the bullets. [/INST]`
  );
}

function fallback(transcript: string): SummaryResult {
  const sentences = transcript
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(Boolean);
  const bullets = sentences.slice(0, 3);
  return {bullets, readSeconds: 5};
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
    const parsed: {bullets: string[]; readSeconds: number} = JSON.parse(
      match[0],
    );
    if (
      Array.isArray(parsed.bullets) &&
      typeof parsed.readSeconds === 'number'
    ) {
      return {bullets: parsed.bullets, readSeconds: parsed.readSeconds};
    }
    return null;
  } catch {
    return null;
  }
}

export async function summarize(transcript: string): Promise<SummaryResult> {
  console.log('--- Summarizing Transcript ---');
  console.log(transcript);

  try {
    const token = HUGGINGFACE_API_TOKEN ?? '';
    const response = await axios.post<{generated_text: string}[]>(
      SUMMARIZE_ENDPOINT,
      {
        inputs: buildPrompt(transcript),
        parameters: {
          max_new_tokens: 200,
          return_full_text: false,
        }
      },
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
