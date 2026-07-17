export const SUBSCRIPTION_MAPPING: Record<string, string> = {
  // Fast Food, Food Truck, Cafe, Bakery, Dessert, Juice -> Starter (BASIC)
  'fastfood': 'BASIC',
  'truck': 'BASIC',
  'cafe': 'BASIC',
  'bakery': 'BASIC',
  'dessert': 'BASIC',
  'juice': 'BASIC',

  // Casual Dining, Pizzeria, BBQ, Sushi, Asian, Healthy, Local, Seafood, Middle Eastern, Other -> Professional (PRO)
  'casual': 'PRO',
  'pizzeria': 'PRO',
  'bbq': 'PRO',
  'sushi': 'PRO',
  'asian': 'PRO',
  'healthy': 'PRO',
  'local': 'PRO',
  'seafood': 'PRO',
  'middleeast': 'PRO',
  'other': 'PRO',

  // Fine Dining, Steakhouse, Buffet, Bar & Lounge -> Enterprise (ENTERPRISE)
  'finedining': 'ENTERPRISE',
  'steakhouse': 'ENTERPRISE',
  'buffet': 'ENTERPRISE',
  'lounge': 'ENTERPRISE',
};

export const getPlanNameForRestaurantType = (type: string): string => {
  return SUBSCRIPTION_MAPPING[type] || 'PRO';
};

export const getDisplayPlanName = (planName: string): string => {
  switch (planName) {
    case 'BASIC':
      return 'Starter Plan';
    case 'ENTERPRISE':
      return 'Enterprise Plan';
    case 'PRO':
    default:
      return 'Professional Plan';
  }
};
