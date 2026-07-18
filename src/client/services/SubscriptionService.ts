export type PlanType = 'PRO';

export interface PlanLimit {
  maxStaff: number;
  maxBranches: number;
  allowedRoles: string[];
  features: {
    pos: boolean;
    kds: boolean;
    menu: boolean;
    tables: boolean;
    orders: boolean;
    basicReports: boolean;
    cashier: boolean;
    inventory: boolean;
    messaging: boolean;
    advancedReports: boolean;
    branding: boolean;
    receiptManagement: boolean;
    multiBranch: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    customIntegrations: boolean;
  };
}

export const PLAN_LIMITS: Record<PlanType, PlanLimit> = {
  PRO: {
    maxStaff: 99999,
    maxBranches: 99999,
    allowedRoles: ['ADMIN', 'WAITER', 'KITCHEN_STAFF', 'CASHIER'],
    features: {
      pos: true,
      kds: true,
      menu: true,
      tables: true,
      orders: true,
      basicReports: true,
      cashier: true,
      inventory: true,
      messaging: true,
      advancedReports: true,
      branding: true,
      receiptManagement: true,
      multiBranch: true,
      apiAccess: true,
      whiteLabel: true,
      customIntegrations: true,
    }
  }
};

export const SubscriptionService = {
  isFeatureAllowed(plan: string, feature: keyof PlanLimit['features']): boolean {
    const limits = PLAN_LIMITS[plan as PlanType] || PLAN_LIMITS.PRO;
    return !!limits.features[feature];
  },

  isRoleAllowed(plan: string, role: string): boolean {
    const limits = PLAN_LIMITS[plan as PlanType] || PLAN_LIMITS.PRO;
    return limits.allowedRoles.includes(role);
  },

  getStaffLimit(plan: string): number {
    const limits = PLAN_LIMITS[plan as PlanType] || PLAN_LIMITS.PRO;
    return limits.maxStaff;
  },

  getBranchLimit(plan: string): number {
    const limits = PLAN_LIMITS[plan as PlanType] || PLAN_LIMITS.PRO;
    return limits.maxBranches;
  }
};
