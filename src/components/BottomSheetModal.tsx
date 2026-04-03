import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  NativeModules,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import WavyIcon from './WavyIcon';
import DotsLoader from './DotsLoader';
import BulletPoints from './BulletPoints';
import TranscriptDropdown from './TranscriptDropdown';
import Sound from 'react-native-sound';
import RNBlobUtil from 'react-native-blob-util';
import { transcribe } from '../api/transcribe';
import { summarize } from '../api/summarize';
import { formatDuration } from '../utils/formatDuration';
import { isFreeLimitReached, addUsage } from '../hooks/useUsageTracker';
import { saveEntry } from '../store/historyStore';
import colors from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  audioUri: string | null;
  audioDuration: number;
  mimeType?: string | null;
}

type State = 'processing' | 'retrying' | 'result' | 'error';

export default function BottomSheetModal({
  visible,
  onClose,
  audioUri,
  audioDuration,
  mimeType,
}: BottomSheetModalProps) {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();

  const [state, setState] = useState<State>('processing');
  const [transcript, setTranscript] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [readSeconds, setReadSeconds] = useState(5);
  const [errorMsg, setErrorMsg] = useState('');
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [realDuration, setRealDuration] = useState(audioDuration);
  console.log("Duration:", realDuration)
  const resultOpacity = useSharedValue(0);
  const resultStyle = useAnimatedStyle(() => ({ opacity: resultOpacity.value }));

  const hasStarted = useRef(false);

  useEffect(() => {
    if (!visible) {
      setState('processing');
      setTranscript('');
      setBullets([]);
      setErrorMsg('');
      resultOpacity.value = 0;
      hasStarted.current = false;
      return;
    }

    if (hasStarted.current) return;
    hasStarted.current = true;

    if (isFreeLimitReached()) {
      setLimitModalVisible(true);
      return;
    }

    runTranscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function getAudioDuration(uri: string): Promise<number> {
    console.log('--- Native Duration Detection ---');
    try {
      const duration = await NativeModules.DurationModule.getDuration(uri);
      console.log('Native Detected Duration:', duration);
      return duration;
    } catch (e) {
      console.log('Native duration detection failed:', e);
      return 0;
    }
  }

  async function runTranscription() {
    try {
      if (!audioUri) throw new Error("No audio URI provided.");
      setState('processing');

      // Get real duration if it's 0 (Shared from WhatsApp)
      let duration = realDuration;
      if (duration === 0) {
        duration = await getAudioDuration(audioUri);
        setRealDuration(duration);
      }

      const text = await transcribe(audioUri, mimeType, () => setState('retrying'));
      setTranscript(text);

      const summary = await summarize(text);
      setBullets(summary.bullets);
      setReadSeconds(summary.readSeconds);

      addUsage(duration);

      await saveEntry({
        id: `${Date.now()}`,
        audioUri,
        duration: duration,
        transcript: text,
        bullets: summary.bullets,
        readSeconds: summary.readSeconds,
        createdAt: new Date().toISOString(),
      });

      resultOpacity.value = withTiming(1, { duration: 400 });
      setState('result');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transcription failed';
      setErrorMsg(msg);
      setState('error');
    }
  }

  function handleCopy() {
    Clipboard.setString(transcript);
    Alert.alert('Copied', 'Transcript copied to clipboard');
  }

  async function handleReply() {
    try {
      await Share.open({ message: transcript, title: 'Voice note reply' });
    } catch {
      // user cancelled — ignore
    }
  }

  async function handleShare() {
    try {
      await Share.open({ message: transcript });
    } catch {
      // user cancelled — ignore
    }
  }

  return (
    <>
      {/* Free limit modal */}
      <Modal
        visible={limitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLimitModalVisible(false)}>
        <View style={styles.limitBackdrop}>
          <View style={styles.limitCard}>
            <Text style={styles.limitTitle}>Free limit reached</Text>
            <Text style={styles.limitBody}>
              You've used your 3 free minutes. Upgrade to keep transcribing
              unlimited voice notes.
            </Text>
            <TouchableOpacity
              style={styles.limitButton}
              onPress={() => {
                setLimitModalVisible(false);
                onClose();
                try {
                  navigation.navigate('Settings');
                } catch (e) {
                  // Silent fail in contexts where 'Settings' doesn't exist
                }
              }}>
              <Text style={styles.limitButtonText}>View Plans</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setLimitModalVisible(false);
                onClose();
              }}>
              <Text style={styles.limitDismiss}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main bottom sheet */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={styles.sheet}>
            <View style={styles.handle} />

            {(state === 'processing' || state === 'retrying') && (
              <View style={styles.centerContent}>
                <Text style={styles.processingTitle}>
                  Understanding voice note
                </Text>
                <View style={styles.loadingRow}>
                  <Text style={styles.processingSubtitle}>
                    {state === 'retrying'
                      ? 'Model is warming up, retrying'
                      : 'Transcribing &  summarizing'}
                  </Text>
                  <DotsLoader />
                </View>
                <WavyIcon isAnimating size={88} />
              </View>
            )}

            {state === 'error' && (
              <View style={styles.centerContent}>
                <Text style={styles.processingTitle}>Something went wrong</Text>
                <Text style={styles.processingSubtitle}>{errorMsg}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={runTranscription}>
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {state === 'result' && (
              <Animated.View style={[styles.resultContent, resultStyle]}>
                <Text style={styles.resultTitle}>Voice Note Summary</Text>
                <Text style={styles.resultMeta}>
                  ⏱ {formatDuration(realDuration)} voice note • Read in{' '}
                  {readSeconds} sec
                </Text>
                <BulletPoints bullets={bullets} />
                <TranscriptDropdown transcript={transcript} />
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                    <Text style={styles.actionText}>Copy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.sheetBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.handleColor,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  processingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  resultContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  resultMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignSelf: 'stretch',
    marginTop: 20,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryBlue,
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: colors.primaryBlue,
    borderRadius: 12,
    marginTop: 8,
  },
  retryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  limitBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 28,
    marginHorizontal: 32,
    alignItems: 'center',
  },
  limitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  limitBody: {
    fontSize: 14,
    color: colors.textSubtle,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  limitButton: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 12,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  limitButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  limitDismiss: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
