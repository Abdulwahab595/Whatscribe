import RNBlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import Config from 'react-native-config';

const WHISPER_ENDPOINT =
  'https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo';
const HUGGINGFACE_API_TOKEN = Config.HUGGINGFACE_API_TOKEN;
console.log(
  'Token loaded:',
  HUGGINGFACE_API_TOKEN ? 'YES' : 'NO — .env not loaded!',
);

function getContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.flac')) return 'audio/flac';
  if (lower.endsWith('.wav')) return 'audio/wav';
  return 'audio/ogg';
}

async function resolveToLocalPath(
  uri: string,
  mimeType?: string | null,
): Promise<{path: string; isTemp: boolean}> {
  if (!uri) throw new Error('Audio URI is null or undefined');
  if (uri.startsWith('content://')) {
    const ext =
      mimeType?.includes('mp4') || mimeType?.includes('m4a')
        ? 'm4a'
        : mimeType?.includes('mpeg')
        ? 'mp3'
        : mimeType?.includes('flac')
        ? 'flac'
        : mimeType?.includes('wav')
        ? 'wav'
        : 'ogg';
    const tempPath = `${
      RNFS.CachesDirectoryPath
    }/temp_audio_${Date.now()}.${ext}`;
    await RNFS.copyFile(uri, tempPath);
    return {path: tempPath, isTemp: true};
  }
  return {path: uri.replace('file://', ''), isTemp: false};
}

async function doRequest(
  uri: string,
  mimeType?: string | null,
): Promise<string> {
  if (!uri)
    throw new Error('Audio URI is null or undefined — no file was shared');
  const contentType = (mimeType || getContentType(uri)).split(';')[0].trim();
  const token = HUGGINGFACE_API_TOKEN ?? '';

  console.log('--- Transcription Debug (Pure Native) ---');
  console.log('URI:', uri);
  console.log('Content-Type:', contentType);

  const {path: localPath, isTemp} = await resolveToLocalPath(uri, mimeType);
  console.log('Local Path:', localPath);

  try {
    // Send raw binary audio — HuggingFace router expects binary body, not base64 JSON
    const response = await RNBlobUtil.fetch(
      'POST',
      WHISPER_ENDPOINT,
      {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
        'x-wait-for-model': 'true',
        'x-use-cache': 'false',
      },
      RNBlobUtil.wrap(localPath),
    );

    const status = response.respInfo.status;
    const responseText = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {error: responseText};
    }
    console.log('Status Code:', status);
    console.log('Response:', JSON.stringify(data).slice(0, 200));

    if (status === 503 || data?.error?.toLowerCase?.().includes('loading')) {
      return '__RETRY__';
    }

    if (status < 200 || status >= 300 || data?.error) {
      const detail = data?.error || data?.message || 'Unknown error';
      throw new Error(`Transcription failed (${status}): ${detail}`);
    }

    if (!data?.text) {
      throw new Error('No transcript returned from AI');
    }

    const rawTranscript = data.text.trim();
    console.log('--- Raw Whisper Transcript ---');
    console.log(rawTranscript);
    console.log('------------------------------');

    return rawTranscript;
  } catch (err) {
    if (err instanceof Error && err.message.includes('__RETRY__'))
      return '__RETRY__';
    console.log('Transcription Error:', err);
    throw err;
  } finally {
    if (isTemp) {
      RNFS.unlink(localPath).catch(() => {});
    }
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
