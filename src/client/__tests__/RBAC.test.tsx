import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../App';
import { useAuth } from '../context/AuthContext';

// Mock contexts
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../context/TenantContext', () => ({
  useTenant: () => ({
    tenant: { id: 't-1', name: 'Test Tenant', currencyCode: 'ETB', currencySymbol: 'ETB' },
    loading: false,
    error: null,
    setTenant: vi.fn(),
    currencyCode: 'ETB',
    currencySymbol: 'ETB',
    currencyName: 'Ethiopian Birr'
  }),
  TenantProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../components/ui/LoadingSpinner', () => ({
  PageLoader: () => <div>Loading...</div>,
}));

describe('RBAC Routing Protection', () => {
  it('redirects to /login if user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      role: null,
      loading: false,
      signOut: vi.fn(),
      impersonatedTenantId: null,
      setImpersonatedTenantId: vi.fn(),
      preparationStation: null,
      userTenantId: null,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  it('allows access if user has the allowed role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u-1', email: 'admin@test.com' } as any,
      session: {} as any,
      role: 'ADMIN',
      loading: false,
      signOut: vi.fn(),
      impersonatedTenantId: null,
      setImpersonatedTenantId: vi.fn(),
      preparationStation: null,
      userTenantId: null,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Admin Content/i)).toBeInTheDocument();
  });

  it('redirects unauthorized waiter user to waiter landing page', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'w-1', email: 'waiter@test.com' } as any,
      session: {} as any,
      role: 'WAITER',
      loading: false,
      signOut: vi.fn(),
      impersonatedTenantId: null,
      setImpersonatedTenantId: vi.fn(),
      preparationStation: null,
      userTenantId: null,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/waiter" element={<div>Waiter Home</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Waiter Home/i)).toBeInTheDocument();
  });
});
