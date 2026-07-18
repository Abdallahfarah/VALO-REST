export type PlanType = 'BASIC' | 'PRO' | 'ENTERPRISE';

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
  BASIC: {
    maxStaff: 99999,
    maxBranches: 3,
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
      apiAccess: false,
      whiteLabel: false,
      customIntegrations: false,
    }
  },
  PRO: {
    maxStaff: 99999,
    maxBranches: 3,
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
      apiAccess: false,
      whiteLabel: false,
      customIntegrations: false,
    }
  },
  ENTERPRISE: {
    maxStaff: 99999,
    maxBranches: 3,
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
      apiAccess: false,
      whiteLabel: false,
      customIntegrations: false,
    }
  }
};

export const SubscriptionService = {
  isFeatureAllowed(plan: PlanType, feature: keyof PlanLimit['features']): boolean {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.PRO;
    return !!limits.features[feature];
  },

  isRoleAllowed(plan: PlanType, role: string): boolean {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.PRO;
    return limits.allowedRoles.includes(role);
  },

  getStaffLimit(plan: PlanType): number {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.PRO;
    return limits.maxStaff;
  },

  getBranchLimit(plan: PlanType): number {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.PRO;
    return limits.maxBranches;
  }
};
