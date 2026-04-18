import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  getLanguagePreference,
  setLanguagePreference,
} from '../hooks/useUsageTracker';
import colors from '../theme/colors';
import { showToast } from '../utils/toast';

const LANGUAGE_OPTIONS = [
  { label: 'Auto-detect', code: 'auto' },
  { label: 'Urdu / Punjabi / Saraiki', code: 'ur' },
  { label: 'English', code: 'en' },
  { label: 'Arabic', code: 'ar' },
  { label: 'Hindi', code: 'hi' },
  { label: 'Turkish', code: 'tr' },
  { label: 'French', code: 'fr' },
  { label: 'German', code: 'de' },
];

export default function LanguageSettingsScreen() {
  const navigation = useNavigation();
  const [selectedLanguage, setSelectedLanguage] = useState(getLanguagePreference());
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    
    // Mimic API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLanguagePreference(selectedLanguage);
    setIsSaving(false);
    showToast('Language updated successfully');
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transcription Language</Text>
        <Text style={styles.subtitle}>
          Select the primary language of your voice notes for better accuracy.
        </Text>
      </View>

      <View style={styles.grid}>
        {LANGUAGE_OPTIONS.map(opt => {
          const isActive = selectedLanguage === opt.code;
          return (
            <TouchableOpacity
              key={opt.code}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setSelectedLanguage(opt.code)}
              activeOpacity={0.7}>
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {opt.label}
              </Text>
              {isActive && (
                <Icon name="checkmark-circle" size={18} color={colors.white} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}>
          {isSaving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 24,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  grid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: '45%',
    justifyContent: 'space-between',
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.white,
  },
  footer: {
    padding: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
