import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  purchaseErrorListener,
  purchaseUpdatedListener,
  type Purchase,
  finishTransaction,
} from 'react-native-iap';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  initializeIAP,
  closeIAP,
  purchaseItem,
  restorePurchases,
  PRODUCT_IDS,
} from '../utils/subscriptionUtils';
import {
  getPlanType,
  setPlanType,
  getUsageSeconds,
  getRemainingSeconds,
  getPlanLimit,
  resetUsage,
} from '../hooks/useUsageTracker';
import type { PlanType } from '../hooks/useUsageTracker';
import { formatDuration } from '../utils/formatDuration';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';
import colors from '../theme/colors';

type Plan = 'starter' | 'monthly' | 'yearly';

interface PlanConfig {
  key: Plan;
  label: string;
  usdPrice: string;
  pkrPrice: string;
  desc: string;
  popular?: boolean;
  oneTime?: boolean;
}

const PLAN_CONFIG: PlanConfig[] = [
  {
    key: 'starter',
    label: 'Starter Pack',
    usdPrice: '$0.49',
    pkrPrice: 'PKR 50',
    desc: '20 minutes of transcriptions • One-time',
    oneTime: true,
  },
  {
    key: 'monthly',
    label: 'Monthly',
    usdPrice: '$1.99/mo',
    pkrPrice: 'PKR 200/month',
    desc: 'Unlimited transcriptions',
  },
  {
    key: 'yearly',
    label: 'Yearly',
    usdPrice: '$14.99/yr',
    pkrPrice: 'PKR 1,500/year',
    desc: 'Unlimited • Save PKR 900/year',
    popular: true,
  },
];

const isInPakistan = true; // Could be dynamic based on locale

export default function SubscriptionSettingsScreen() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const selectedPlanConfig = selectedPlan ? PLAN_CONFIG.find(p => p.key === selectedPlan) : null;
  const [planType, setPlanTypeState] = useState<PlanType>(getPlanType());
  const [loading, setLoading] = useState(false);
  const { config: alertConfig, showAlert, hideAlert } = useCustomAlert();

  const usageSeconds = getUsageSeconds();
  const remainingSeconds = getRemainingSeconds();
  const planLimit = getPlanLimit(planType);
  const usagePercent = Math.min((usageSeconds / planLimit) * 100, 100);

  useEffect(() => {
    let updateListener: any;
    let errorListener: any;

    const setup = async () => {
      await initializeIAP();
      
      updateListener = purchaseUpdatedListener(async (purchase: Purchase) => {
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          try {
            await finishTransaction({ purchase, isConsumable: purchase.productId === PRODUCT_IDS.starter });
            
            if (purchase.productId === PRODUCT_IDS.starter) {
              setPlanType('starter');
              setPlanTypeState('starter');
              resetUsage();
              showAlert('Purchased!', "You now have 20 minutes of transcription.");
            } else {
              setPlanType('premium');
              setPlanTypeState('premium');
              showAlert('Subscribed!', "You're now on Premium.");
            }
          } catch (ackErr) {
            console.warn('ackErr', ackErr);
          }
        }
      });

      errorListener = purchaseErrorListener((error) => {
        console.warn('purchaseErrorListener', error);
      });

      const isPremium = await restorePurchases();
      if (isPremium) {
        setPlanType('premium');
        setPlanTypeState('premium');
      }
    };

    setup();

    return () => {
      if (updateListener) updateListener.remove();
      if (errorListener) errorListener.remove();
      closeIAP();
    };
  }, []);

  async function handleSubscribe() {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const productId = PRODUCT_IDS[selectedPlan];
      const isSubscription = selectedPlan !== 'starter';
      
      const success = await purchaseItem(productId, isSubscription);
      if (!success) {
        showAlert('Error', 'Could not initiate purchase.');
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
      const isPremium = await restorePurchases();
      if (isPremium) {
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Plan & Billing</Text>
          <Text style={styles.subtitle}>
            Current Plan: <Text style={styles.planStatus}>{planType === 'premium' ? 'Premium (Active)' : 'Free Plan'}</Text>
          </Text>
        </View>

        {planType !== 'premium' && (
          <View style={styles.usageCard}>
            <View style={styles.usageHeader}>
              <Text style={styles.usageText}>Remaining Transcription</Text>
              <Text style={styles.usageValue}>{formatDuration(remainingSeconds)}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${usagePercent}%` }]} />
            </View>
            <Text style={styles.limitLabel}>Limit: {planType === 'starter' ? '20 mins' : '3 mins'}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Choose a plan</Text>

        {PLAN_CONFIG.map(plan => {
          const isSelected = selectedPlan === plan.key;
          const isPopular = plan.popular;
          return (
            <TouchableOpacity
              key={plan.key}
              style={[
                styles.planCard,
                isPopular && !isSelected && styles.planCardPopular,
                isSelected && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan(plan.key)}
              activeOpacity={0.8}>
              {isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>POPULAR</Text>
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={[styles.planLabel, isPopular && !isSelected && styles.planLabelWhite, isSelected && { color: colors.primaryBlue }]}>
                  {plan.label}
                </Text>
                <Text style={[styles.planDesc, isPopular && !isSelected && styles.planDescWhite]}>
                  {plan.desc}
                </Text>
              </View>
              <Text style={[styles.planPrice, isPopular && !isSelected && styles.planPriceWhite]}>
                {isInPakistan ? plan.pkrPrice : plan.usdPrice}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={handleRestore}
          style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Restore existing purchase</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.subscribeBtn, (loading || !selectedPlan) && styles.subscribeBtnDisabled]}
          onPress={handleSubscribe}
          disabled={loading || !selectedPlan}
          activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.subscribeBtnText}>
              {!selectedPlan 
                ? 'Select a plan'
                : selectedPlanConfig?.oneTime
                  ? 'Buy Pack'
                  : 'Subscribe Now'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <CustomAlert config={alertConfig} onDismiss={hideAlert} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    padding: 24,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  planStatus: {
    color: colors.primaryBlue,
    fontWeight: '700',
  },
  usageCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  usageText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  usageValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryBlue,
  },
  limitLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardPopular: {
    backgroundColor: colors.primaryBlue,
  },
  planCardSelected: {
    borderColor: colors.primaryBlue,
    backgroundColor: colors.white,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FBD38D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#744210',
  },
  cardInfo: {
    flex: 1,
    marginRight: 10,
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  planLabelWhite: {
    color: colors.white,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  planPriceWhite: {
    color: colors.white,
  },
  planDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  planDescWhite: {
    color: '#BFDBFE',
  },
  restoreBtn: {
    alignSelf: 'center',
    padding: 16,
    marginTop: 8,
  },
  restoreText: {
    color: colors.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
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
  subscribeBtn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeBtnDisabled: {
    backgroundColor: '#CBD5E0',
  },
  subscribeBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
