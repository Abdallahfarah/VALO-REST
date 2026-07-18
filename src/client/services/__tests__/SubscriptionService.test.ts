import { describe, it, expect } from 'vitest';
import { SubscriptionService } from '../SubscriptionService';

describe('SubscriptionService Plan Limit Checks (Migrated to single PRO plan)', () => {
  it('correctly resolves features allowed on BASIC plan (mapped to PRO)', () => {
    expect(SubscriptionService.isFeatureAllowed('BASIC', 'pos')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('BASIC', 'kds')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('BASIC', 'basicReports')).toBe(true);
    
    expect(SubscriptionService.isFeatureAllowed('BASIC', 'cashier')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('BASIC', 'messaging')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('BASIC', 'branding')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('BASIC', 'apiAccess')).toBe(false);
  });

  it('correctly resolves features allowed on PRO plan', () => {
    expect(SubscriptionService.isFeatureAllowed('PRO', 'pos')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('PRO', 'cashier')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('PRO', 'messaging')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('PRO', 'branding')).toBe(true);
    
    expect(SubscriptionService.isFeatureAllowed('PRO', 'apiAccess')).toBe(false);
  });

  it('correctly resolves features allowed on ENTERPRISE plan (mapped to PRO)', () => {
    expect(SubscriptionService.isFeatureAllowed('ENTERPRISE', 'pos')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('ENTERPRISE', 'cashier')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('ENTERPRISE', 'messaging')).toBe(true);
    expect(SubscriptionService.isFeatureAllowed('ENTERPRISE', 'apiAccess')).toBe(false);
    expect(SubscriptionService.isFeatureAllowed('ENTERPRISE', 'whiteLabel')).toBe(false);
  });

  it('verifies staff headcount limits', () => {
    expect(SubscriptionService.getStaffLimit('BASIC')).toBe(99999);
    expect(SubscriptionService.getStaffLimit('PRO')).toBe(99999);
    expect(SubscriptionService.getStaffLimit('ENTERPRISE')).toBe(99999);
  });

  it('verifies branch limits', () => {
    expect(SubscriptionService.getBranchLimit('BASIC')).toBe(3);
    expect(SubscriptionService.getBranchLimit('PRO')).toBe(3);
    expect(SubscriptionService.getBranchLimit('ENTERPRISE')).toBe(3);
  });

  it('verifies allowed roles per plan', () => {
    expect(SubscriptionService.isRoleAllowed('BASIC', 'ADMIN')).toBe(true);
    expect(SubscriptionService.isRoleAllowed('BASIC', 'WAITER')).toBe(true);
    expect(SubscriptionService.isRoleAllowed('BASIC', 'KITCHEN_STAFF')).toBe(true);
    expect(SubscriptionService.isRoleAllowed('BASIC', 'CASHIER')).toBe(true);

    expect(SubscriptionService.isRoleAllowed('PRO', 'CASHIER')).toBe(true);
  });
});
