import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BulletPoints from '../components/BulletPoints';
import TranscriptDropdown from '../components/TranscriptDropdown';
import { formatDuration } from '../utils/formatDuration';
import { showToast } from '../utils/toast';
import FullMessageModal from '../components/FullMessageModal';
import colors from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Route = RouteProp<RootStackParamList, 'Result'>;

export default function ResultScreen() {
  const route = useRoute<Route>();
  const {
    transcript,
    bullets,
    fullSummary,
    fullTranslation,
    readSeconds,
    audioDuration,
    autoShowFullMessage,
  } = route.params;

  const [showFullMessage, setShowFullMessage] = useState(false);

  useEffect(() => {
    if (autoShowFullMessage) {
      setShowFullMessage(true);
    }
  }, [autoShowFullMessage]);

  function handleCopy() {
    Clipboard.setString(fullSummary);
    showToast('Copied to clipboard');
  }

  async function handleShare() {
    try {
      await Share.open({ message: fullSummary });
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
      <TranscriptDropdown summary={fullSummary} />

      {audioDuration > 180 && (
        <TouchableOpacity
          onPress={() => setShowFullMessage(true)}
          style={styles.fullMsgBtn}>
          <Text style={styles.fullMsgBtnText}>See Full Message</Text>
          <Ionicons name="arrow-forward-circle" size={16} color={colors.primaryBlue} />
        </TouchableOpacity>
      )}

      <FullMessageModal
        visible={showFullMessage}
        onClose={() => setShowFullMessage(false)}
        fullTranslation={fullTranslation || fullSummary}
      />

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleCopy}
          activeOpacity={0.7}>
          <Ionicons name="copy-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.actionText}>Copy</Text>
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleShare}
          activeOpacity={0.7}>
          <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
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
  fullMsgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
    paddingVertical: 4,
  },
  fullMsgBtnText: {
    color: colors.primaryBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 7,
  },
  actionDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
