import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Purchases, {type PurchasesPackage} from 'react-native-purchases';
import {
  getPlanType,
  setPlanType,
  getUsageSeconds,
  getRemainingSeconds,
  getLanguagePreference,
  setLanguagePreference,
} from '../hooks/useUsageTracker';
import {formatDuration} from '../utils/formatDuration';
import {checkSubscriptionStatus} from '../utils/subscriptionUtils';
import CustomAlert, {useCustomAlert} from '../components/CustomAlert';
import colors from '../theme/colors';

type Plan = 'starter' | 'monthly' | 'yearly';

const isInPakistan =
  Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Karachi';

const LANGUAGE_OPTIONS: {code: string; label: string}[] = [
  {code: 'auto', label: 'Auto-detect'},
  {code: 'ur', label: 'Urdu / Punjabi / Saraiki'},
  {code: 'en', label: 'English'},
  {code: 'ar', label: 'Arabic'},
  {code: 'hi', label: 'Hindi'},
  {code: 'tr', label: 'Turkish'},
  {code: 'fr', label: 'French'},
  {code: 'de', label: 'German'},
];

const PLAN_CONFIG: {
  key: Plan;
  label: string;
  pkrPrice: string;
  usdPrice: string;
  desc: string;
  popular: boolean;
  oneTime: boolean;
}[] = [
  {
    key: 'starter',
    label: 'Starter Pack',
    pkrPrice: 'PKR 50',
    usdPrice: '$0.18',
    desc: '20 minutes of transcriptions • One-time',
    popular: false,
    oneTime: true,
  },
  {
    key: 'monthly',
    label: 'Monthly',
    pkrPrice: 'PKR 200/month',
    usdPrice: '$0.72/month',
    desc: 'Unlimited transcriptions',
    popular: false,
    oneTime: false,
  },
  {
    key: 'yearly',
    label: 'Yearly',
    pkrPrice: 'PKR 1,500/year',
    usdPrice: '$5.40/year',
    desc: 'Unlimited • Save PKR 900/year',
    popular: true,
    oneTime: false,
  },
];

const PRODUCT_IDS: Record<Plan, string> = {
  starter: 'whatscribe_starter',
  monthly: 'whatscribe_monthly',
  yearly: 'whatscribe_yearly',
};

export default function SettingsScreen() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');
  const selectedPlanConfig = PLAN_CONFIG.find(p => p.key === selectedPlan);
  const [planType, setPlanTypeState] = useState<'free' | 'premium'>(
    getPlanType(),
  );
  const [loading, setLoading] = useState(false);
  const {config: alertConfig, showAlert, hideAlert} = useCustomAlert();
  const [language, setLanguageState] = useState(getLanguagePreference());

  const usageSeconds = getUsageSeconds();
  const remainingSeconds = getRemainingSeconds();
  const usagePercent = Math.min((usageSeconds / 180) * 100, 100);

  useEffect(() => {
    checkSubscriptionStatus()
      .then(isPremium => {
        if (isPremium) {
          setPlanType('premium');
          setPlanTypeState('premium');
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const offerings = await Purchases.getOfferings();
      const packages = offerings.current?.availablePackages ?? [];

      const productId = PRODUCT_IDS[selectedPlan];
      const pkg: PurchasesPackage | undefined = packages.find(
        p => p.product.identifier === productId,
      );

      if (!pkg) {
        showAlert(
          'Not available',
          'This plan is not available in your region.',
        );
        return;
      }

      const {customerInfo} = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active['premium']) {
        setPlanType('premium');
        setPlanTypeState('premium');
        showAlert('Subscribed!', "You're now on Premium.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Purchase failed';
      if (!msg.includes('cancelled')) {
        showAlert('Purchase failed', msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['premium']) {
        setPlanType('premium');
        setPlanTypeState('premium');
        showAlert('Restored', 'Premium plan restored successfully.');
      } else {
        showAlert('Nothing to restore', 'No active subscription found.');
      }
    } catch {
      showAlert('Error', 'Could not restore purchases.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Plan badge */}
      <View style={styles.planBadgeRow}>
        <View
          style={[
            styles.planBadge,
            planType === 'premium' && styles.planBadgePremium,
          ]}>
          <Text style={styles.planBadgeText}>
            {planType === 'premium' ? 'Premium Plan' : 'Free Plan'}
          </Text>
        </View>
      </View>

      {planType === 'free' && (
        <View style={styles.usageSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {width: `${usagePercent}%`}]} />
          </View>
          <Text style={styles.usageLabel}>
            {formatDuration(remainingSeconds)} remaining of 3:00 free minutes
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Transcription language</Text>
      <View style={styles.langGrid}>
        {LANGUAGE_OPTIONS.map(opt => {
          const isActive = language === opt.code;
          return (
            <TouchableOpacity
              key={opt.code}
              style={[styles.langChip, isActive && styles.langChipActive]}
              onPress={() => {
                setLanguageState(opt.code);
                setLanguagePreference(opt.code);
              }}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.langChipText,
                  isActive && styles.langChipTextActive,
                ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Choose a plan</Text>

      {PLAN_CONFIG.map(plan => {
        const isSelected = selectedPlan === plan.key;
        const isPopular = plan.popular;
        return (
          <TouchableOpacity
            key={plan.key}
            style={[
              styles.planCard,
              isPopular && styles.planCardPopular,
              !isPopular && isSelected && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan(plan.key)}
            activeOpacity={0.8}>
            {isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
            )}
            <Text
              style={[styles.planLabel, isPopular && styles.planLabelWhite]}>
              {plan.label}
            </Text>
            <Text
              style={[styles.planPrice, isPopular && styles.planPriceWhite]}>
              {isInPakistan ? plan.pkrPrice : plan.usdPrice}
            </Text>
            <Text style={[styles.planDesc, isPopular && styles.planDescWhite]}>
              {plan.desc}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.subscribeBtn, loading && styles.subscribeBtnDisabled]}
        onPress={handleSubscribe}
        disabled={loading}
        activeOpacity={0.85}>
        <Text style={styles.subscribeBtnText}>
          {loading
            ? 'Processing...'
            : selectedPlanConfig?.oneTime
            ? 'Buy Pack'
            : 'Subscribe'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleRestore} disabled={loading}>
        <Text style={styles.restoreText}>Restore purchases</Text>
      </TouchableOpacity>

      <CustomAlert config={alertConfig} onDismiss={hideAlert} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  langChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.cardBackground,
  },
  langChipActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: colors.primaryBlue,
  },
  langChipText: {
    fontSize: 13,
    color: colors.textSubtle,
    fontWeight: '500',
  },
  langChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  planBadgeRow: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planBadge: {
    backgroundColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  planBadgePremium: {
    backgroundColor: colors.primaryBlue,
  },
  planBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  usageSection: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryBlue,
    borderRadius: 4,
  },
  usageLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planCardPopular: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
    borderWidth: 2,
  },
  planCardSelected: {
    borderColor: colors.primaryBlue,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  planLabelWhite: {
    color: colors.white,
  },
  planPrice: {
    fontSize: 15,
    color: colors.primaryBlue,
    fontWeight: '600',
    marginBottom: 4,
  },
  planPriceWhite: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  planDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  planDescWhite: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  subscribeBtn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  subscribeBtnDisabled: {
    opacity: 0.6,
  },
  subscribeBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  restoreText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
