import Purchases, { PurchasesPackage } from 'react-native-purchases';

export const PRODUCT_IDS = {
  monthly: 'whatscribe_monthly',
  yearly: 'whatscribe_yearly',
  lifetime: 'whatscribe_lifetime',
};

export async function fetchOfferings(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  if (offerings.current && offerings.current.availablePackages.length > 0) {
    return offerings.current.availablePackages;
  }
  return [];
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo.entitlements.active['premium'] !== undefined;
}

export async function restorePurchases(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo.entitlements.active['premium'] !== undefined;
}

export async function checkSubscriptionStatus(): Promise<boolean> {
  const customerInfo = await Purchases.getCustomerInfo();
  return customerInfo.entitlements.active['premium'] !== undefined;
}
