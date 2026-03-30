import RNBlobUtil from 'react-native-blob-util';
import Config from 'react-native-config';

const WHISPER_ENDPOINT =
  'https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo';

function getContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.flac')) return 'audio/flac';
  if (lower.endsWith('.wav')) return 'audio/wav';
  return 'audio/ogg'; // covers .ogg and .opus (WhatsApp default)
}

async function doRequest(uri: string): Promise<string> {
  const contentType = getContentType(uri);
  const token = Config.HUGGINGFACE_API_TOKEN ?? '';

  if (!token) {
    throw new Error('HUGGINGFACE_API_TOKEN is missing from .env');
  }

  const cleanUri = uri.replace('file://', '');

  const response = await RNBlobUtil.fetch(
    'POST',
    WHISPER_ENDPOINT,
    {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
    RNBlobUtil.wrap(cleanUri), // sends raw binary — correct way
  );

  const status = response.respInfo.status;

  // Model cold start
  if (status === 503) {
    return '__RETRY__';
  }

  // Rate limited
  if (status === 429) {
    throw new Error('Rate limit reached. Please wait a moment and try again.');
  }

  // Auth error
  if (status === 401) {
    throw new Error('Invalid HuggingFace API token. Check your .env file.');
  }

  if (status < 200 || status >= 300) {
    throw new Error(`Transcription failed with status ${status}`);
  }

  const json: { text?: string; error?: string } = response.json();

  // HuggingFace sometimes returns error in json even with 200
  if (json.error) {
    throw new Error(`HuggingFace error: ${json.error}`);
  }

  if (!json.text) {
    throw new Error('No transcript returned from API');
  }

  return json.text.trim();
}

export async function transcribe(
  audioUri: string,
  onRetrying?: () => void,
): Promise<string> {
  const result = await doRequest(audioUri);

  if (result === '__RETRY__') {
    onRetrying?.();
    // Wait 20 seconds for model to warm up
    await new Promise(resolve => setTimeout(resolve, 20000));

    const retried = await doRequest(audioUri);

    if (retried === '__RETRY__') {
      throw new Error(
        'Model is still warming up. Please try again in a moment.',
      );
    }

    return retried;
  }

  return result;
}
