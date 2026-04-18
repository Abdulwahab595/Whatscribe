import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  getPlanType,
  getUsageSeconds,
  getRemainingSeconds,
  getPlanLimit,
  getLanguagePreference,
} from '../hooks/useUsageTracker';
import { formatDuration } from '../utils/formatDuration';
import colors from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = StackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const [planType, setPlanType] = useState(getPlanType());
  const [langCode, setLangCode] = useState(getLanguagePreference());

  useFocusEffect(
    useCallback(() => {
      setPlanType(getPlanType());
      setLangCode(getLanguagePreference());
    }, [])
  );

  const usageSeconds = getUsageSeconds();
  const remainingSeconds = getRemainingSeconds();
  const planLimit = getPlanLimit(planType);
  const usagePercent = Math.min((usageSeconds / planLimit) * 100, 100);

  const currentLangLabel = {
    auto: 'Auto-detect',
    ur: 'Urdu/Punjabi',
    en: 'English',
    ar: 'Arabic',
    hi: 'Hindi',
    tr: 'Turkish',
    fr: 'French',
    de: 'German',
  }[langCode] || 'English';

  const MenuItem = ({ icon, label, sublabel, onPress, color = colors.primaryBlue }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.menuIconBox, { backgroundColor: color + '15' }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{label}</Text>
        {sublabel && <Text style={styles.menuSublabel}>{sublabel}</Text>}
      </View>
      <Icon name="chevron-forward" size={18} color={colors.border} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Plan Header Card */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>
                {planType === 'premium' ? 'PREMIUM' : 'FREE PLAN'}
              </Text>
            </View>
            <Text style={styles.planTitle}>Usage for this month</Text>
          </View>

          <View style={styles.usageRow}>
            <Text style={styles.usageMain}>{formatDuration(remainingSeconds)}</Text>
            <Text style={styles.usageSub}> remaining of {planType === 'premium' ? '∞' : '3:00'}</Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${usagePercent}%` }]} />
          </View>
        </View>

        {/* Settings Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>App Settings</Text>
          <MenuItem
            icon="globe-outline"
            label="Transcription Language"
            sublabel={currentLangLabel}
            onPress={() => navigation.navigate('LanguageSettings')}
          />
          <MenuItem
            icon="card-outline"
            label="Plan & Billing"
            sublabel={planType === 'premium' ? 'Premium Active' : 'Upgrade your plan'}
            onPress={() => navigation.navigate('SubscriptionSettings')}
            color="#059669"
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>Data & Security</Text>
          <MenuItem
            icon="cloud-upload-outline"
            label="Backup & Restore"
            sublabel="Export your local history"
            onPress={() => navigation.navigate('BackupSettings')}
            color="#7C3AED"
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>Support</Text>
          <MenuItem
            icon="help-circle-outline"
            label="Help Center"
            onPress={() => {
              Linking.openURL('mailto:asad223nawaz@gmail.com')
                .catch(() => Alert.alert('Error', 'No email app found on this device.'));
            }}
            color="#EA580C"
          />
          <MenuItem
            icon="star-outline"
            label="Rate Whatscribe"
            onPress={() => {
              // Placeholder for Play Store URL (Market link)
              Linking.openURL('market://details?id=com.whatscribe')
                .catch(() => Linking.openURL('https://play.google.com/store/apps/details?id=com.whatscribe'));
            }}
            color="#EAB308"
          />
        </View>

        <Text style={styles.versionText}>Version 1.0.0 (Internal Alpha)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  planCard: {
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  planBadge: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  planBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  planTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  usageMain: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  usageSub: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryBlue,
  },
  menuSection: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuSublabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  versionText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 32,
    fontWeight: '500',
  },
});
