import RNBlobUtil from 'react-native-blob-util';

// Using a fresh endpoint with cache-busting to ensure we don't get old looping results
const WHISPER_ENDPOINT =
  'https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo?language=pa&task=transcribe';
const HUGGINGFACE_API_TOKEN='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';

function getContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.flac')) return 'audio/flac';
  if (lower.endsWith('.wav')) return 'audio/wav';
  return 'audio/ogg'; 
}

async function doRequest(uri: string, mimeType?: string | null): Promise<string> {
  const contentType = (mimeType || getContentType(uri)).split(';')[0].trim();
  const token = HUGGINGFACE_API_TOKEN ?? '';
  const cleanUri = uri.replace('file://', '');

  console.log('--- Transcription Debug (Pure Native) ---');
  console.log('URI:', uri);
  console.log('Content-Type:', contentType);

  try {
    // Reverting to the very first method that successfully sent files
    // But adding strict cache-control to prevent the memory-heavy loop crashes
    const response = await RNBlobUtil.fetch(
      'POST',
      `${WHISPER_ENDPOINT}&v=${Date.now()}`, // Cache-buster
      {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
        'x-wait-for-model': 'true',
        'x-use-cache': 'false', // Ensure fresh results
      },
      RNBlobUtil.wrap(cleanUri),
    );

    const status = response.respInfo.status;
    console.log('Status Code:', status);

    // If status is not 200, it's likely a cold start (503)
    if (status === 503) return '__RETRY__';

    let json: any = {};
    try {
      json = response.json();
    } catch (e) {
      console.log('Failed to parse response JSON');
    }

    if (status < 200 || status >= 300) {
      const detail = json.error || json.message || 'Unknown error';
      throw new Error(`Transcription failed (${status}): ${detail}`);
    }

    if (!json.text) {
      throw new Error('No transcript returned from AI');
    }

    const rawTranscript = json.text.trim();
    console.log('--- Raw Whisper Transcript ---');
    console.log(rawTranscript);
    console.log('------------------------------');

    return rawTranscript;
  } catch (err) {
    if (err instanceof Error && err.message.includes('__RETRY__')) return '__RETRY__';
    console.log('Transcription Error:', err);
    throw err;
  }
}

export async function transcribe(
  audioUri: string,
  mimeType?: string | null,
  onRetrying?: () => void,
): Promise<string> {
  const result = await doRequest(audioUri, mimeType);

  if (result === '__RETRY__') {
    onRetrying?.();
    await new Promise(resolve => setTimeout(resolve, 20000));
    const retried = await doRequest(audioUri, mimeType);
    if (retried === '__RETRY__') {
      throw new Error('Model is warming up. Please try again soon.');
    }
    return retried;
  }

  return result;
}
