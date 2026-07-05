import { useTenant } from '../context/TenantContext';

export interface CurrencyConfig {
  symbol: string;
  position: 'prefix' | 'suffix';
  space: boolean;
}

// Registry map of supported currencies to enforce metadata/config-driven rendering
export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: { symbol: '$', position: 'prefix', space: false },
  ETB: { symbol: 'ETB', position: 'prefix', space: true },
  EUR: { symbol: '€', position: 'prefix', space: false },
  GBP: { symbol: '£', position: 'prefix', space: false },
  SAR: { symbol: 'SR', position: 'prefix', space: true },
  AED: { symbol: 'AED', position: 'prefix', space: true },
  KES: { symbol: 'KSh', position: 'prefix', space: true },
  SOS: { symbol: 'Sh', position: 'prefix', space: true }
};

export const CurrencyService = {
  format(amount: number, currency: string = 'ETB'): string {
    const safeCurrency = (currency || 'ETB').toUpperCase();
    const config = CURRENCY_CONFIGS[safeCurrency] || { symbol: safeCurrency, position: 'prefix', space: true };
    const formattedAmount = Number(amount || 0).toFixed(2);
    
    if (config.position === 'prefix') {
      return `${config.symbol}${config.space ? ' ' : ''}${formattedAmount}`;
    } else {
      return `${formattedAmount}${config.space ? ' ' : ''}${config.symbol}`;
    }
  },

  formatMoney(amount: number, currency: string = 'ETB'): string {
    return this.format(amount, currency);
  }
};

export const useCurrency = () => {
  const { tenant } = useTenant();
  const currencyCode = tenant?.currencyCode || 'ETB';
  const currencySymbol = tenant?.currencySymbol || 'ETB';

  const format = (amount: number) => {
    return CurrencyService.format(amount, currencyCode);
  };

  const formatMoney = (amount: number) => {
    return CurrencyService.formatMoney(amount, currencyCode);
  };

  return { 
    currency: currencyCode, // Backwards compatibility
    currencyCode,
    currencySymbol,
    format, 
    formatMoney 
  };
};
