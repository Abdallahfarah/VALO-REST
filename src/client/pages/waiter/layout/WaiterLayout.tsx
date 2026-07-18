import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { WaiterSidebar } from './WaiterSidebar';
import { WaiterHeader } from './WaiterHeader';
import { RestaurantIdentityHeader } from '../../../components/layout/RestaurantIdentityHeader';
import { ValoSaaSBackground } from '../../../components/layout/ValoSaaSBackground';

export const WaiterLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <WaiterSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="lg:pl-[260px] pl-0 flex flex-col min-h-screen">
        <WaiterHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="relative flex-1 p-4 sm:p-8 overflow-y-auto">
          <ValoSaaSBackground type="waiter" />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
