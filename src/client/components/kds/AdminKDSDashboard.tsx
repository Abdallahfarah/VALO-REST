import { Activity, Clock, Flame, Users, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/card';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { KdsService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';

export const AdminKDSDashboard = ({ kitchenOrders }: { kitchenOrders: any[] }) => {
  const { tenant } = useTenant();

  const { data: metrics } = useQuery({
    queryKey: ['kdsMetrics', tenant?.id],
    queryFn: () => KdsService.getKdsMetrics(tenant?.id || ''),
    enabled: !!tenant?.id,
    refetchInterval: 30000,
  });

  const getElapsedMinutes = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white relative overflow-hidden">
          <div className="flex items-center justify-between z-10 relative">
            <div>
              <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Total Active</p>
              <h3 className="text-2xl font-bold text-[#0B1630]">{metrics?.totalActiveOrders || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white relative overflow-hidden">
          <div className="flex items-center justify-between z-10 relative">
            <div>
              <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Avg Prep Time</p>
              <h3 className="text-2xl font-bold text-[#0B1630]">{metrics?.avgPrepTimeMins || 0}m</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white relative overflow-hidden">
          <div className="flex items-center justify-between z-10 relative">
            <div>
              <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Delayed ({'>'}20m)</p>
              <h3 className="text-2xl font-bold text-red-600">{metrics?.delayedOrders || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Flame size={20} />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white relative overflow-hidden">
          <div className="flex items-center justify-between z-10 relative">
            <div>
              <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Busiest Station</p>
              <h3 className="text-xl font-bold text-[#0B1630] truncate max-w-[120px]">
                {metrics?.stationWorkload && Object.keys(metrics.stationWorkload).length > 0
                  ? Object.keys(metrics.stationWorkload).reduce((a, b) => metrics.stationWorkload[a] > metrics.stationWorkload[b] ? a : b)
                  : 'None'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-bold text-[#0B1630] mb-4 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-500" /> Master Queue (All Stations)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kitchenOrders.map((order: any) => {
            const elapsed = getElapsedMinutes(order.createdAt);
            const statusLabel = order.status === 'PENDING' ? 'New' : order.status === 'PREPARING' ? 'Cooking' : 'Ready';
            const statusColor = order.status === 'READY' ? 'text-emerald-600 bg-emerald-50' : 'text-orange-600 bg-orange-50';

            return (
              <Card key={order.id} className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Order</span>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded uppercase", statusColor)}>{statusLabel}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                    <div className={cn("w-1.5 h-1.5 rounded-full", elapsed > 15 ? "bg-red-500" : "bg-[#F97316]")} />
                    <span className="font-bold">{elapsed}m</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-3xl font-bold text-[#0B1630]">#{order.id.slice(0, 6)}</h3>
                  <span className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
                    TABLE {order.table?.number || 'N/A'}
                  </span>
                </div>
                <ul className="mb-5 mt-3 space-y-1.5">
                  {order.items?.map((item: any, j: number) => {
                    const isDone = item.status === 'READY';
                    return (
                      <li key={j} className="text-sm flex items-center justify-between">
                        <span className={cn("font-medium", isDone ? "text-[#94A3B8] line-through" : "text-[#0B1630]")}>
                          {item.quantity}x {item.menuItem?.name || 'Unknown'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 rounded">
                          {item.menuItem?.preparationStation || 'Chef'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
