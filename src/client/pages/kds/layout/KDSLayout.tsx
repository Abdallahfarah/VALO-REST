import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { KDSSidebar } from './KDSSidebar';
import { KDSHeader } from './KDSHeader';
import { RestaurantIdentityHeader } from '../../../components/layout/RestaurantIdentityHeader';

export const KDSLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <KDSSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="lg:pl-[260px] pl-0 flex flex-col min-h-screen">
        <KDSHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
