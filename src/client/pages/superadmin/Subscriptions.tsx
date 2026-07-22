import { CreditCard, TrendingUp, ChevronRight, CheckCircle2, Store, Star, Building } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { SuperAdminService } from '../../services/ApiService';
import { supabase } from '../../../lib/supabase';

export const Subscriptions = () => {
  const { data: stats } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: () => SuperAdminService.getOverviewStats(),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*, subscriptions(count)')
        .order('price', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions-feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plans(name), tenants(name)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    }
  });

  const planIcons: Record<string, any> = {
    'ENTERPRISE': Building,
    'PRO': Store,
    'TRIAL': Star,
  };

  return (
    <div className="space-y-6 max-w-[1500px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Entitlement Architecture</h1>
          <p className="text-[#94A3B8] mt-1 text-sm font-medium">Strategic plan matrix and entitlement feed for platform growth.</p>
        </div>
        <span className="text-xs font-bold text-white bg-[#1E293B] px-3 py-1.5 rounded-full border border-[#232B5E]/50 uppercase tracking-wider">
          Active Plans: {plans.length}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl overflow-hidden relative bg-[#131A38]/70 backdrop-blur-md">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-indigo-400"><CreditCard size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Platform MRR</p>
              <h3 className="text-3xl font-bold text-white">ETB {(stats?.platformRevenue ?? 0).toFixed(2)}</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-4 z-10 relative">Live Revenue</p>
          <svg className="absolute bottom-0 right-0 w-24 h-12 opacity-30 text-indigo-400" viewBox="0 0 100 50" fill="none"><path d="M0,40 Q25,10 50,30 T100,20" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl overflow-hidden relative bg-[#131A38]/70 backdrop-blur-md">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-emerald-400"><TrendingUp size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Active Subscriptions</p>
              <h3 className="text-3xl font-bold text-white">{stats?.activeSubsCount ?? 0}</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-4 z-10 relative">Operational</p>
          <svg className="absolute bottom-0 right-0 w-24 h-12 opacity-30 text-emerald-400" viewBox="0 0 100 50" fill="none"><path d="M0,30 Q25,20 50,35 T100,15" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl overflow-hidden relative bg-[#131A38]/70 backdrop-blur-md">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-[#F97316]"><TrendingUp size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Tenants</p>
              <h3 className="text-3xl font-bold text-white">{stats?.tenantCount ?? 0}</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-4 z-10 relative">Growth</p>
          <svg className="absolute bottom-0 right-0 w-24 h-12 opacity-30 text-orange-400" viewBox="0 0 100 50" fill="none"><path d="M0,40 Q25,30 50,20 T100,10" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Strategic Matrix */}
        <Card className="lg:col-span-2 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md">
          <div className="p-6 pb-4 flex items-center justify-between border-b border-[#232B5E]/30">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-[#94A3B8]" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Plan Strategic Matrix</h3>
            </div>
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Monthly Revenue</span>
          </div>
          <div className="divide-y divide-[#232B5E]/30">
            {plans.map((plan: any) => {
              const PlanIcon = planIcons[plan.name?.toUpperCase()] || Store;
              return (
                <div key={plan.id} className="px-6 py-5 flex items-center justify-between hover:bg-[#1E293B]/40 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-[#94A3B8] group-hover:text-[#F97316] transition-colors">
                      <PlanIcon size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{plan.name}</p>
                      <p className="text-xs text-[#94A3B8] font-semibold mt-0.5 uppercase tracking-wider">{plan.description || 'SaaS Plan'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">${Number(plan.price).toFixed(0)}</span>
                    <span className="text-xs text-[#94A3B8]">/mo</span>
                    <ChevronRight size={16} className="text-[#94A3B8] ml-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Entitlement Feed */}
        <Card className="border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md">
          <div className="p-6 pb-4 flex items-center gap-2 border-b border-[#232B5E]/30">
            <CreditCard size={18} className="text-[#94A3B8]" />
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Entitlement Feed</h3>
          </div>
          <div className="divide-y divide-[#232B5E]/30">
            {subscriptions.map((sub: any) => (
              <div key={sub.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#1E293B]/40 transition-colors">
                <div>
                  <p className="text-xs font-bold text-white">{sub.tenants?.name || 'Unknown'}</p>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase mt-0.5">{sub.plans?.name || 'N/A'} • {sub.status}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-[#94A3B8] font-medium">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </span>
                  <CheckCircle2 size={14} className="text-emerald-400 mt-1" />
                </div>
              </div>
            ))}
            {subscriptions.length === 0 && (
              <div className="px-6 py-8 text-center text-xs text-[#94A3B8] font-bold">No entitlement events</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
