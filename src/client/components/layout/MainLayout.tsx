import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { RestaurantIdentityHeader } from './RestaurantIdentityHeader';
import { ValoSaaSBackground } from './ValoSaaSBackground';

export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-[260px] ml-0 min-w-0">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="relative flex-1 p-4 sm:p-8 overflow-y-auto">
          <ValoSaaSBackground type="admin" />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
