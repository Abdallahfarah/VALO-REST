import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useSessionStore } from './lib/session-store';
import { ImpersonationBanner } from './components/ImpersonationBanner';
import { ToastContainer } from './components/ui/toast';
import { PageLoader } from './components/ui/LoadingSpinner';
import { toast } from './lib/toast-store';
import { ValoAiPanel } from './components/ValoAiPanel';

// Layouts (kept eager — small, used immediately on first paint)
import { MainLayout } from './components/layout/MainLayout';
import { WaiterLayout } from './pages/waiter/layout/WaiterLayout';
import { KDSLayout } from './pages/kds/layout/KDSLayout';
import { CashierLayout } from './pages/cashier/layout/CashierLayout';
import { NexusLayout } from './pages/superadmin/layout/NexusLayout';

// Auth pages (eager — first paint)
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Public QR menu (eager — used without auth, must load on first hit)
import { CustomerQRMenu } from './pages/CustomerQRMenu';

// ─── Lazy-loaded page chunks ───

// Admin pages
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Orders = React.lazy(() => import('./pages/Orders').then(m => ({ default: m.Orders })));
const POS = React.lazy(() => import('./pages/POS').then(m => ({ default: m.POS })));
const Tables = React.lazy(() => import('./pages/Tables').then(m => ({ default: m.Tables })));
const KitchenQueue = React.lazy(() => import('./pages/KitchenQueue').then(m => ({ default: m.KitchenQueue })));
const Menu = React.lazy(() => import('./pages/Menu').then(m => ({ default: m.Menu })));
const Staff = React.lazy(() => import('./pages/Staff').then(m => ({ default: m.Staff })));
const Reports = React.lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const QrOrdering = React.lazy(() => import('./pages/QrOrdering').then(m => ({ default: m.QrOrdering })));

// Waiter pages
const WaiterDashboard = React.lazy(() => import('./pages/waiter/Dashboard').then(m => ({ default: m.WaiterDashboard })));
const WaiterTables = React.lazy(() => import('./pages/waiter/Tables').then(m => ({ default: m.WaiterTables })));
const WaiterPOS = React.lazy(() => import('./pages/waiter/POS').then(m => ({ default: m.WaiterPOS })));
const MyOrders = React.lazy(() => import('./pages/waiter/MyOrders').then(m => ({ default: m.MyOrders })));
const Messages = React.lazy(() => import('./pages/waiter/Messages').then(m => ({ default: m.Messages })));
const Notifications = React.lazy(() => import('./pages/waiter/Notifications').then(m => ({ default: m.Notifications })));

// KDS pages
const OrdersMonitor = React.lazy(() => import('./pages/kds/OrdersMonitor').then(m => ({ default: m.OrdersMonitor })));
const KDSReports = React.lazy(() => import('./pages/kds/KDSReports').then(m => ({ default: m.KDSReports })));
const KDSMessages = React.lazy(() => import('./pages/kds/KDSMessages').then(m => ({ default: m.KDSMessages })));

// Cashier pages
const Payments = React.lazy(() => import('./pages/cashier/Payments').then(m => ({ default: m.Payments })));
const Receipts = React.lazy(() => import('./pages/cashier/Receipts').then(m => ({ default: m.Receipts })));
const CashierMessages = React.lazy(() => import('./pages/cashier/CashierMessages').then(m => ({ default: m.CashierMessages })));

// SuperAdmin pages
const Restaurants = React.lazy(() => import('./pages/superadmin/Restaurants').then(m => ({ default: m.Restaurants })));
const Overview = React.lazy(() => import('./pages/superadmin/Overview').then(m => ({ default: m.Overview })));
const Subscriptions = React.lazy(() => import('./pages/superadmin/Subscriptions').then(m => ({ default: m.Subscriptions })));
const UserProvisioning = React.lazy(() => import('./pages/superadmin/UserProvisioning').then(m => ({ default: m.UserProvisioning })));
const PlatformRevenue = React.lazy(() => import('./pages/superadmin/PlatformRevenue').then(m => ({ default: m.PlatformRevenue })));
const AuditLogs = React.lazy(() => import('./pages/superadmin/AuditLogs').then(m => ({ default: m.AuditLogs })));
const SystemHealth = React.lazy(() => import('./pages/superadmin/SystemHealth').then(m => ({ default: m.SystemHealth })));

// ─── QueryClient with production defaults ───
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,          // Data fresh for 30s — no refetch within window
      gcTime: 5 * 60 * 1000,     // Keep unused cache for 5 minutes
      refetchOnMount: false,      // Don't refetch if data is still fresh on navigation
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: any) => {
        toast.error('Action failed', error?.message || 'An unexpected error occurred');
      },
    },
  },
});

import { Onboarding } from './pages/auth/Onboarding';

// ─── Slide-in animation ───
const globalStyles = `
@keyframes slideIn {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
`;

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  SUPER_ADMIN: '/platform/overview',
  WAITER: '/waiter',
  KITCHEN_STAFF: '/kds',
  CASHIER: '/cashier',
};

export const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, role, loading: authLoading } = useAuth();
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();
  const location = useLocation();

  if (authLoading) return <PageLoader label="Authenticating..." />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (tenantError) {
    return <Navigate to="/login" replace />;
  }

  // Skip tenant loading check for Platform Owner (SUPER_ADMIN)
  if (role !== 'SUPER_ADMIN' && tenantLoading) {
    return <PageLoader label="Loading Workspace..." />;
  }

  const isSuperAdmin = role === 'SUPER_ADMIN';

  // If user has no tenant (needs onboarding) and is not a super admin
  if (!isSuperAdmin && !tenant) {
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // If user has a tenant but tries to access onboarding page
  if (tenant && location.pathname === '/onboarding') {
    return <Navigate to={ROLE_HOME[role ?? ''] || '/admin'} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_HOME[role] || '/login'} replace />;
  }

  return <>{children}</>;
};

const RoleRedirect = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();
  if (authLoading) return <PageLoader label="Authenticating..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (tenantError) return <Navigate to="/login" replace />;
  if (role !== 'SUPER_ADMIN' && tenantLoading) {
    return <PageLoader label="Loading Workspace..." />;
  }
  if (role !== 'SUPER_ADMIN' && !tenant) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Navigate to={ROLE_HOME[role ?? ''] || '/admin'} replace />;
};

const ScrollPersistenceManager = () => {
  const location = useLocation();
  const setScrollPosition = useSessionStore((state) => state.setScrollPosition);
  const scrollPositions = useSessionStore((state) => state.scrollPositions);

  useEffect(() => {
    // Restore scroll position
    const saved = scrollPositions[location.pathname] || 0;
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTop = saved;
    }

    const handleScroll = () => {
      const el = document.querySelector('main');
      if (el) {
        setScrollPosition(location.pathname, el.scrollTop);
      }
    };

    // Attach scroll listener
    const el = document.querySelector('main');
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Set up a MutationObserver to handle dynamically loading content scroll restoration
    const observer = new MutationObserver(() => {
      const elCurrent = document.querySelector('main');
      if (elCurrent && elCurrent.scrollTop === 0 && saved > 0) {
        elCurrent.scrollTop = saved;
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (el) {
        el.removeEventListener('scroll', handleScroll);
      }
      observer.disconnect();
    };
  }, [location.pathname, scrollPositions, setScrollPosition]);

  return null;
};

export const App = () => {
  return (
    <ErrorBoundary>
      <style>{globalStyles}</style>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <TenantProvider>
              <ScrollPersistenceManager />
              <ImpersonationBanner />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  {/* Public Customer QR Routes */}
                  <Route path="/r/:slug" element={<CustomerQRMenu />} />
                  <Route path="/r/:slug/t/:tableNumber" element={<CustomerQRMenu />} />
                  <Route path="/onboarding" element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  } />
                  <Route path="/" element={<RoleRedirect />} />
                  
                  {/* Restaurant Admin */}
                  <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <MainLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="pos" element={<POS />} />
                    <Route path="kitchen" element={<KitchenQueue />} />
                    <Route path="menu" element={<Menu />} />
                    <Route path="tables" element={<Tables />} />
                    <Route path="staff" element={<Staff />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="qr-ordering" element={<QrOrdering />} />
                  </Route>

                  {/* Waiter Application */}
                  <Route path="/waiter" element={
                    <ProtectedRoute allowedRoles={['WAITER', 'ADMIN']}>
                      <WaiterLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<WaiterDashboard />} />
                    <Route path="dashboard" element={<WaiterDashboard />} />
                    <Route path="tables" element={<WaiterTables />} />
                    <Route path="pos" element={<WaiterPOS />} />
                    <Route path="pos/:tableId" element={<WaiterPOS />} />
                    <Route path="orders" element={<MyOrders />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="notifications" element={<Notifications />} />
                  </Route>

                  {/* Kitchen Display System (KDS) */}
                  <Route path="/kds" element={
                    <ProtectedRoute allowedRoles={['KITCHEN_STAFF', 'ADMIN']}>
                      <KDSLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<OrdersMonitor />} />
                    <Route path="reports" element={<KDSReports />} />
                    <Route path="messages" element={<KDSMessages />} />
                  </Route>

                  {/* Cashier Application */}
                  <Route path="/cashier" element={
                    <ProtectedRoute allowedRoles={['CASHIER', 'ADMIN']}>
                      <CashierLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Payments />} />
                    <Route path="payments" element={<Payments />} />
                    <Route path="receipts" element={<Receipts />} />
                    <Route path="messages" element={<CashierMessages />} />
                    <Route path="ai" element={<ValoAiPage />} />
                  </Route>

                  {/* Platform Owner (Super Admin) */}
                  <Route path="/platform" element={
                    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                      <NexusLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="overview" element={<Overview />} />
                    <Route path="restaurants" element={<Restaurants />} />
                    <Route path="subscriptions" element={<Subscriptions />} />
                    <Route path="provisioning" element={<UserProvisioning />} />
                    <Route path="revenue" element={<PlatformRevenue />} />
                    <Route path="audit" element={<AuditLogs />} />
                    <Route path="health" element={<SystemHealth />} />
                    <Route path="*" element={<Navigate to="/platform/overview" replace />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
              <ToastContainer />
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

const ValoAiPage = () => {
  const navigate = useNavigate();
  return (
    <div className="h-[calc(100vh-140px)] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <ValoAiPanel onClose={() => navigate('/cashier')} />
    </div>
  );
};
