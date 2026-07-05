import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService, TableService } from '../ApiService';
import { mockSupabaseResponse } from '../../../test/setup';

describe('ApiService - OrderService & TableService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseResponse.data = [];
    mockSupabaseResponse.error = null;
  });

  it('should retrieve orders for tenant', async () => {
    mockSupabaseResponse.data = [
      { id: 'o-1', tenant_id: 't-1', total_amount: 15.5, status: 'PENDING' }
    ];

    const res = await OrderService.getOrders('t-1');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('o-1');
    expect(res[0].totalAmount).toBe(15.5);
  });

  it('should update order status', async () => {
    mockSupabaseResponse.data = { id: 'o-1', status: 'PREPARING' };

    const res = await OrderService.updateOrderStatus('o-1', 'PREPARING');
    expect(res!.status).toBe('PREPARING');
  });

  it('should retrieve tables for tenant', async () => {
    mockSupabaseResponse.data = [
      { id: 'tbl-1', tenant_id: 't-1', number: '5', capacity: 4, status: 'AVAILABLE' }
    ];

    const res = await TableService.getTables('t-1');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('tbl-1');
    expect(res[0].number).toBe('5');
  });
});
