import { describe, it, expect } from 'vitest';
import { SubscriptionService } from '../SubscriptionService';

describe('SubscriptionService Plan Limit Checks (Single Plan PRO)', () => {
  it('correctly resolves features allowed on PRO plan', () => {
    expect(SubscriptionService.isFeatureAllowed('PRO', 'pos')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('PRO', 'kds')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('PRO', 'basicReports')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('PRO', 'cashier')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('PRO', 'messaging')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('PRO', 'branding')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('PRO', 'apiAccess')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('PRO', 'whiteLabel')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('PRO', 'customIntegrations')).toBe(true);
  });

  it('verifies staff headcount limits on PRO plan', () => {
    expect(SubscriptionService.getStaffLimit('PRO')).toBe(99999);
  });

  it('verifies branch limits on PRO plan', () => {
    expect(SubscriptionService.getBranchLimit('PRO')).toBe(99999);
  });

  it('verifies allowed roles per PRO plan', () => {
    expect(SubscriptionService.isRoleAllowed('PRO', 'ADMIN')).toBe(true);
    expect(SubscriptionService.isRoleAllowed('PRO', 'WAITER')).toBe(true);
    expect(SubscriptionService.isRoleAllowed('PRO', 'KITCHEN_STAFF')).toBe(true);
    expect(SubscriptionService.isRoleAllowed('PRO', 'CASHIER')).toBe(true);
  });
});
