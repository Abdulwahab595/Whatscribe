import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import WavyIcon from '../components/WavyIcon';
import DotsLoader from '../components/DotsLoader';
import {transcribe} from '../api/transcribe';
import {summarize} from '../api/summarize';
import {formatDuration} from '../utils/formatDuration';
import {isFreeLimitReached, addUsage} from '../hooks/useUsageTracker';
import {saveEntry} from '../store/historyStore';
import colors from '../theme/colors';
import type {RootStackParamList} from '../navigation/AppNavigator';

type Nav = StackNavigationProp<RootStackParamList, 'Processing'>;
type Route = RouteProp<RootStackParamList, 'Processing'>;

type State = 'idle' | 'processing' | 'retrying' | 'summarizing' | 'error';

export default function ProcessingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {audioUri, audioDuration} = route.params;

  const [state, setState] = useState<State>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleTap = useCallback(async () => {
    if (state !== 'idle') return;

    if (isFreeLimitReached()) {
      navigation.navigate('Settings');
      return;
    }

    try {
      setState('processing');
      const text = await transcribe(audioUri, () => setState('retrying'));
      setTranscript(text);
      setState('summarizing');
      const summary = await summarize(text);

      addUsage(audioDuration);

      await saveEntry({
        id: `${Date.now()}`,
        audioUri,
        duration: audioDuration,
        transcript: text,
        bullets: summary.bullets,
        fullSummary: summary.fullSummary,
        readSeconds: summary.readSeconds,
        createdAt: new Date().toISOString(),
      });

      navigation.navigate('Result', {
        transcript: text,
        bullets: summary.bullets,
        fullSummary: summary.fullSummary,
        readSeconds: summary.readSeconds,
        audioDuration,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transcription failed';
      setErrorMsg(msg);
      setState('error');
    }
  }, [audioUri, audioDuration, navigation, state]);

  const isRunning =
    state === 'processing' || state === 'retrying' || state === 'summarizing';

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Voice note received</Text>

      <View style={styles.card}>
        <TouchableOpacity
          onPress={handleTap}
          activeOpacity={0.8}
          disabled={isRunning}>
          <WavyIcon
            isAnimating={state === 'processing' || state === 'retrying'}
            size={88}
          />
        </TouchableOpacity>

        <Text style={styles.cardTitle}>Voice note received</Text>

        {audioDuration > 0 && (
          <Text style={styles.cardMeta}>
            {formatDuration(audioDuration)} voice note
          </Text>
        )}

        {(state === 'processing' || state === 'retrying') && (
          <View style={styles.loaderRow}>
            <DotsLoader />
            <Text style={styles.loadingLabel}>
              {state === 'retrying'
                ? 'Model is warming up, retrying...'
                : 'Transcribing...'}
            </Text>
          </View>
        )}

        {state === 'summarizing' && (
          <>
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptText} numberOfLines={4}>
                {transcript}
              </Text>
            </View>
            <View style={styles.loaderRow}>
              <DotsLoader />
              <Text style={styles.loadingLabel}>Summarizing...</Text>
            </View>
          </>
        )}

        {state === 'idle' && (
          <Text style={styles.tapHint}>Tap to transcribe</Text>
        )}

        {state === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity
              onPress={() => setState('idle')}
              style={styles.retryBtn}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.textPrimary,
    marginTop: 48,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 24,
    marginTop: 32,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 16,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  loaderRow: {
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  loadingLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tapHint: {
    fontSize: 13,
    color: colors.primaryBlue,
    marginTop: 12,
    fontWeight: '600',
  },
  errorBox: {
    alignItems: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 13,
    color: 'red',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: colors.primaryBlue,
    borderRadius: 10,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  transcriptBox: {
    alignSelf: 'stretch',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginTop: 16,
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
