import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';

interface FullMessageModalProps {
  visible: boolean;
  onClose: () => void;
  fullTranslation: string;
}

export default function FullMessageModal({
  visible,
  onClose,
  fullTranslation,
}: FullMessageModalProps) {
  // Split into sentences for line-by-line display
  const lines = fullTranslation
    .split(/(?<=[.!?])\s+|\n+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Full Message</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollPadding}>
            {lines.map((line, index) => (
              <View key={index} style={styles.lineRow}>
                <View style={styles.dot} />
                <Text style={styles.lineText}>{line}</Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollPadding: {
    padding: 24,
    paddingBottom: 40,
  },
  lineRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingRight: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryBlue,
    marginTop: 8,
    marginRight: 12,
  },
  lineText: {
    flex: 1,
    fontSize: 15,
    color: colors.textMid,
    lineHeight: 24,
    fontWeight: '400',
  },
});
