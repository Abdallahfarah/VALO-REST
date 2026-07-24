import { CheckCircle2, ChefHat } from 'lucide-react';
import { Card } from '../ui/card';
import { cn } from '../../../lib/utils';
import { OrderService } from '../../services/ApiService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../lib/toast-store';

export const StationKDSView = ({ 
  kitchenOrders, 
  role, 
  assignedStation 
}: { 
  kitchenOrders: any[]; 
  role: string; 
  assignedStation: string | null 
}) => {
  const queryClient = useQueryClient();

  const getElapsedMinutes = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  const updateStationItemsMutation = useMutation({
    mutationFn: ({ orderId, station, status }: { orderId: string; station: string; status: string }) =>
      OrderService.updateStationItemsStatus(orderId, station, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Station items updated');
    },
  });

  const getStationFilter = () => {
    if (role === 'CHEF') return (station: string) => !['Bar', 'Coffee', 'Beverages'].includes(station);
    if (role === 'BARISTA') return (station: string) => ['Bar', 'Coffee', 'Beverages'].includes(station);
    if (assignedStation) return (station: string) => station === assignedStation;
    return () => true; // Fallback
  };

  const isRelevantStation = getStationFilter();

  const filteredOrders = kitchenOrders.map(order => {
    const relevantItems = (order.items || []).filter((item: any) => 
      isRelevantStation(item.menuItem?.preparationStation || 'Chef')
    );
    return { ...order, items: relevantItems };
  }).filter(order => order.items.length > 0);

  const getStationStatus = (items: any[]) => {
    if (items.every(i => i.status === 'READY')) return 'READY';
    if (items.some(i => i.status === 'PREPARING')) return 'PREPARING';
    return 'PENDING';
  };

  const handleAction = (orderId: string, items: any[]) => {
    const currentStatus = getStationStatus(items);
    let nextStatus = '';
    
    if (currentStatus === 'PENDING') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'READY';
    
    if (nextStatus) {
      // Just take the station from the first item since they are batched in UI
      const station = items[0]?.menuItem?.preparationStation || 'Chef';
      updateStationItemsMutation.mutate({ orderId, station, status: nextStatus });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredOrders.map((order: any) => {
        const elapsed = getElapsedMinutes(order.createdAt);
        const stationStatus = getStationStatus(order.items);
        const statusLabel = stationStatus === 'PENDING' ? 'New' : stationStatus === 'PREPARING' ? 'Cooking' : 'Ready';
        const statusColor = stationStatus === 'READY' ? 'text-emerald-600 bg-emerald-50' : 'text-orange-600 bg-orange-50';

        if (stationStatus === 'READY') return null; // Don't show fully completed orders for this station

        return (
          <Card key={order.id} className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Ticket</span>
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
            <ul className="mb-5 mt-3 space-y-2">
              {order.items.map((item: any, j: number) => {
                const isDone = item.status === 'READY';
                return (
                  <li key={j} className="text-sm flex items-center gap-2">
                    {isDone ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                    )}
                    <span className={cn("font-medium", isDone ? "text-[#94A3B8] line-through" : "text-[#0B1630]")}>
                      {item.quantity}x {item.menuItem?.name || 'Unknown'}
                    </span>
                  </li>
                );
              })}
            </ul>
            
            <button
              onClick={() => handleAction(order.id, order.items)}
              disabled={updateStationItemsMutation.isPending}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50",
                stationStatus === 'PENDING'
                  ? "bg-[#0B1630] text-white hover:bg-[#1A2A52]"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              )}
            >
              {stationStatus === 'PENDING' ? (
                <>
                  <ChefHat size={18} /> Start Preparing
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Mark Ready
                </>
              )}
            </button>
          </Card>
        );
      })}
      
      {filteredOrders.filter((o: any) => getStationStatus(o.items) !== 'READY').length === 0 && (
        <div className="col-span-full py-12 flex flex-col items-center justify-center text-[#94A3B8]">
          <CheckCircle2 size={48} className="mb-4 opacity-50" />
          <h3 className="text-lg font-bold">Queue is clear</h3>
          <p className="text-sm">Waiting for new orders...</p>
        </div>
      )}
    </div>
  );
};
