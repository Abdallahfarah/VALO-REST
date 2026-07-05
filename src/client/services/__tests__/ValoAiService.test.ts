import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValoAiService } from '../ValoAiService';

// Mock Supabase
vi.mock('../../../lib/supabase', () => {
  return {
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => Promise.resolve({ data: [] }),
            maybeSingle: () => Promise.resolve({ data: { currency: 'ETB' } }),
          })
        })
      })
    }
  };
});

describe('ValoAiService Parser Checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly returns the greeting response for default query', async () => {
    const res = await ValoAiService.processMessage('hello', 'tenant-1');
    expect(res.message).toContain('VALO AI Operations Assistant');
    expect(res.type).toBe('text');
  });

  it('correctly parses refund procedures requests', async () => {
    const res = await ValoAiService.processMessage('How to refund an order?', 'tenant-1');
    expect(res.message).toContain('VALO Refund Procedures');
    expect(res.type).toBe('text');
  });

  it('correctly parses discount policy requests', async () => {
    const res = await ValoAiService.processMessage('What is the discount rate?', 'tenant-1');
    expect(res.message).toContain('VALO Discount Guidelines');
    expect(res.type).toBe('text');
  });

  it('returns appropriate help response for payment queries', async () => {
    const res = await ValoAiService.processMessage('payment options', 'tenant-1');
    expect(res.message).toContain('Settle Checkout Instructions');
    expect(res.type).toBe('text');
  });
});
