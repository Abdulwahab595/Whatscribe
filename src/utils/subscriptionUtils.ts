import {
  initConnection,
  endConnection,
  getProducts,
  getSubscriptions,
  requestPurchase,
  requestSubscription,
  getAvailablePurchases,
  type Product,
  type Subscription,
} from 'react-native-iap';
import { Platform } from 'react-native';

export const PRODUCT_IDS = {
  starter: 'whatscribe_starter',
  monthly: 'whatscribe_monthly',
  yearly: 'whatscribe_yearly',
};

const itemSkus = [PRODUCT_IDS.starter];
const subscriptionSkus = [PRODUCT_IDS.monthly, PRODUCT_IDS.yearly];

export async function initializeIAP(): Promise<void> {
  try {
    await initConnection();
  } catch (err) {
    console.warn('IAP Initialization failed', err);
  }
}

export async function closeIAP(): Promise<void> {
  try {
    await endConnection();
  } catch (err) {
    console.warn('IAP Close failed', err);
  }
}

/**
 * In v12, we fetch products and subscriptions specifically.
 */
export async function fetchAllProducts(): Promise<(Product | Subscription)[]> {
  try {
    const products = await getProducts({ skus: itemSkus });
    const subs = await getSubscriptions({ skus: subscriptionSkus });
    return [...products, ...subs];
  } catch (err) {
    console.warn('Fetch products failed', err);
    return [];
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const purchases = await getAvailablePurchases();
    // Logic: if any purchase is active and matches our premium IDs
    return purchases.some(p => 
      subscriptionSkus.includes(p.productId)
    );
  } catch (err) {
    console.warn('Restore failed', err);
    return false;
  }
}

export async function checkSubscriptionStatus(): Promise<boolean> {
  return await restorePurchases();
}

/**
 * purchaseItem handles both consumables and subscriptions
 */
export async function purchaseItem(sku: string, isSubscription: boolean): Promise<boolean> {
  try {
    if (isSubscription) {
      // In v12, requestSubscription takes the sku string directly as an argument or in an object
      await requestSubscription({ sku });
    } else {
      await requestPurchase({ sku });
    }
    return true;
  } catch (err) {
    console.warn('Purchase failed', err);
    return false;
  }
}
