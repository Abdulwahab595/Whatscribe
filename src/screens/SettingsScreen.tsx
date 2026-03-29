import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import {
  getPlanType,
  setPlanType,
  getUsageSeconds,
  getRemainingSeconds,
} from '../hooks/useUsageTracker';
import { formatDuration } from '../utils/formatDuration';
import { checkSubscriptionStatus } from '../utils/subscriptionUtils';
import colors from '../theme/colors';

type Plan = 'monthly' | 'yearly' | 'lifetime';

const PLAN_CONFIG: {
  key: Plan;
  label: string;
  price: string;
  desc: string;
  popular: boolean;
}[] = [
  {
    key: 'monthly',
    label: 'Monthly',
    price: '$2.99/month',
    desc: 'Unlimited transcriptions',
    popular: false,
  },
  {
    key: 'yearly',
    label: 'Yearly',
    price: '$19.99/year',
    desc: 'Best value • Save 44%',
    popular: true,
  },
  {
    key: 'lifetime',
    label: 'Lifetime',
    price: '$49.99 one-time',
    desc: 'Pay once, use forever',
    popular: false,
  },
];

const PRODUCT_IDS: Record<Plan, string> = {
  monthly: 'whatscribe_monthly',
  yearly: 'whatscribe_yearly',
  lifetime: 'whatscribe_lifetime',
};

export default function SettingsScreen() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');
  const [planType, setPlanTypeState] = useState<'free' | 'premium'>(getPlanType());
  const [loading, setLoading] = useState(false);

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
        Alert.alert('Not available', 'This plan is not available in your region.');
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active['premium']) {
        setPlanType('premium');
        setPlanTypeState('premium');
        Alert.alert('Subscribed!', "You're now on Premium.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Purchase failed';
      if (!msg.includes('cancelled')) {
        Alert.alert('Purchase failed', msg);
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
        Alert.alert('Restored', 'Premium plan restored successfully.');
      } else {
        Alert.alert('Nothing to restore', 'No active subscription found.');
      }
    } catch {
      Alert.alert('Error', 'Could not restore purchases.');
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
            <View style={[styles.progressFill, { width: `${usagePercent}%` }]} />
          </View>
          <Text style={styles.usageLabel}>
            {formatDuration(remainingSeconds)} remaining of 3:00 free minutes
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Choose a plan</Text>

      {PLAN_CONFIG.map(plan => (
        <TouchableOpacity
          key={plan.key}
          style={[
            styles.planCard,
            plan.popular && styles.planCardPopular,
            selectedPlan === plan.key && styles.planCardSelected,
          ]}
          onPress={() => setSelectedPlan(plan.key)}
          activeOpacity={0.8}>
          {plan.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>POPULAR</Text>
            </View>
          )}
          <Text style={styles.planLabel}>{plan.label}</Text>
          <Text style={styles.planPrice}>{plan.price}</Text>
          <Text style={styles.planDesc}>{plan.desc}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.subscribeBtn, loading && styles.subscribeBtnDisabled]}
        onPress={handleSubscribe}
        disabled={loading}
        activeOpacity={0.85}>
        <Text style={styles.subscribeBtnText}>
          {loading ? 'Processing...' : 'Subscribe'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleRestore} disabled={loading}>
        <Text style={styles.restoreText}>Restore purchases</Text>
      </TouchableOpacity>
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
    backgroundColor: colors.primaryBlue,
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
  planPrice: {
    fontSize: 15,
    color: colors.primaryBlue,
    fontWeight: '600',
    marginBottom: 4,
  },
  planDesc: {
    fontSize: 13,
    color: colors.textSecondary,
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
