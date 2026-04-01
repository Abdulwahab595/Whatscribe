import RNBlobUtil from 'react-native-blob-util';
// import Config from 'react-native-config';
const HUGGINGFACE_API_TOKEN = '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';

const WHISPER_ENDPOINT =
  'https://api-inference.huggingface.co/models/openai/whisper-large-v2';

function getContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  return 'audio/ogg'; // covers .ogg and .opus
}

// Helper to read content:// URIs as base64
async function getBase64FromUri(uri: string): Promise<string> {
  if (uri.startsWith('content://')) {
    // Read content URI as base64
    const base64 = await RNBlobUtil.fs.readFile(uri, 'base64');
    return base64;
  } else if (uri.startsWith('file://')) {
    // Read file URI as base64
    const base64 = await RNBlobUtil.fs.readFile(uri.replace('file://', ''), 'base64');
    return base64;
  } else {
    throw new Error('Unsupported URI scheme');
  }
}

async function doRequest(uri: string): Promise<string> {
  const contentType = getContentType(uri);
  const token = HUGGINGFACE_API_TOKEN ?? '';

  let body: any;
  if (uri.startsWith('content://') || uri.startsWith('file://')) {
    // Read file as base64 and send as binary
    const base64 = await getBase64FromUri(uri);
    body = RNBlobUtil.base64.decode(base64);
  } else {
    // fallback to wrap for legacy file paths
    body = RNBlobUtil.wrap(uri.replace('file://', ''));
  }

  const response = await RNBlobUtil.fetch(
    'POST',
    WHISPER_ENDPOINT,
    {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
    body,
  );

  const status = response.respInfo.status;

  if (status === 503) {
    return '__RETRY__';
  }

  if (status < 200 || status >= 300) {
    throw new Error(`Transcription failed with status ${status}`);
  }

  const json: {text?: string} = response.json();
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
