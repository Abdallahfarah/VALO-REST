import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { NexusSidebar } from './NexusSidebar';
import { NexusHeader } from './NexusHeader';

export const NexusLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <NexusSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-[260px] ml-0 min-w-0">
        <NexusHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
