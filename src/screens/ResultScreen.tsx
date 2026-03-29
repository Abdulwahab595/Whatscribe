import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import BulletPoints from '../components/BulletPoints';
import TranscriptDropdown from '../components/TranscriptDropdown';
import { formatDuration } from '../utils/formatDuration';
import colors from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Route = RouteProp<RootStackParamList, 'Result'>;

export default function ResultScreen() {
  const route = useRoute<Route>();
  const { transcript, bullets, readSeconds, audioDuration } = route.params;

  function handleCopy() {
    Clipboard.setString(transcript);
    Alert.alert('Copied', 'Transcript copied to clipboard');
  }

  async function handleReply() {
    try {
      await Share.open({ message: transcript, title: 'Voice note reply' });
    } catch {
      // user cancelled
    }
  }

  async function handleShare() {
    try {
      await Share.open({ message: transcript });
    } catch {
      // user cancelled
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Voice Note Summary</Text>
      <Text style={styles.meta}>
        ⏱ {formatDuration(audioDuration)} voice note • Read in {readSeconds} sec
      </Text>

      <BulletPoints bullets={bullets} />
      <TranscriptDropdown transcript={transcript} />

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
          <Text style={styles.actionText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleReply}>
          <Text style={styles.actionText}>Reply</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignSelf: 'stretch',
    marginTop: 24,
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
});
