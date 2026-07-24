import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '../services/ApiService';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { AdminKDSDashboard } from '../components/kds/AdminKDSDashboard';
import { StationKDSView } from '../components/kds/StationKDSView';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const KitchenQueue = () => {
  const { tenant } = useTenant();
  const { role, preparationStation } = useAuth();
  const queryClient = useQueryClient();

  // ─── Realtime ───
  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel('kds-queue-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenant.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders', tenant.id] });
        queryClient.invalidateQueries({ queryKey: ['kdsMetrics', tenant.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders', tenant.id] });
        queryClient.invalidateQueries({ queryKey: ['kdsMetrics', tenant.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenant?.id, queryClient]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Only show kitchen-relevant orders (not COMPLETED/CANCELED)
  const kitchenOrders = orders.filter((o: any) =>
    ['PENDING', 'PREPARING', 'READY'].includes(o.status)
  );

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">
            {isAdmin ? 'Kitchen Performance Queue' : 'Station Work Queue'}
          </h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">
            {isAdmin 
              ? 'Monitor and manage live kitchen operations in real-time.' 
              : `Viewing assigned tasks for role: ${role}`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-bold text-emerald-600 whitespace-nowrap">LIVE OPERATIONS</span>
        </div>
      </div>

      {isAdmin ? (
        <AdminKDSDashboard kitchenOrders={kitchenOrders} />
      ) : (
        <StationKDSView 
          kitchenOrders={kitchenOrders} 
          role={role || 'KITCHEN_STAFF'} 
          assignedStation={preparationStation || null} 
        />
      )}
    </div>
  );
};
