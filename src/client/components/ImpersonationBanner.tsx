import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';

export const ImpersonationBanner = () => {
  const { impersonatedTenantId, setImpersonatedTenantId } = useAuth();
  const { tenant } = useTenant();

  if (!impersonatedTenantId) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-11 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between px-6 z-[9999] shadow-md font-bold text-xs tracking-wider">
      <div className="flex items-center gap-2">
        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Impersonating</span>
        <span className="font-extrabold">{tenant?.name || 'Loading restaurant...'}</span>
        {tenant?.slug && <span className="opacity-75 font-mono text-[10px]">/{tenant.slug}</span>}
      </div>
      <button 
        onClick={() => {
          setImpersonatedTenantId(null);
          // Hard redirect to platform owner dashboard to fully clear out
          window.location.href = '/platform/restaurants';
        }}
        className="bg-white text-orange-600 hover:bg-orange-50 active:scale-[0.97] transition-all px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer"
      >
        Exit Preview
      </button>
    </div>
  );
};
