import RNBlobUtil from 'react-native-blob-util';
import Config from 'react-native-config';

const WHISPER_ENDPOINT =
  'https://api-inference.huggingface.co/models/openai/whisper-large-v2';

function getContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  return 'audio/ogg'; // covers .ogg and .opus
}

async function doRequest(uri: string): Promise<string> {
  const contentType = getContentType(uri);
  const token = Config.HUGGINGFACE_API_TOKEN ?? '';

  const response = await RNBlobUtil.fetch(
    'POST',
    WHISPER_ENDPOINT,
    {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
    RNBlobUtil.wrap(uri.replace('file://', '')),
  );

  const status = response.respInfo.status;

  if (status === 503) {
    return '__RETRY__';
  }

  if (status < 200 || status >= 300) {
    throw new Error(`Transcription failed with status ${status}`);
  }

  const json: { text?: string } = response.json();
  if (!json.text) throw new Error('No transcript returned from API');
  return json.text;
}

export async function transcribe(
  audioUri: string,
  onRetrying?: () => void,
): Promise<string> {
  const result = await doRequest(audioUri);

  if (result === '__RETRY__') {
    onRetrying?.();
    await new Promise(resolve => setTimeout(resolve, 20000));
    const retried = await doRequest(audioUri);
    if (retried === '__RETRY__') {
      throw new Error('Model is still warming up. Please try again shortly.');
    }
    return retried;
  }

  return result;
}
