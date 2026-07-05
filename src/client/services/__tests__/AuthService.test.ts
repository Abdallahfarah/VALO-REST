import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../AuthService';
import { supabase } from '../../../lib/supabase';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call supabase.auth.signInWithPassword on login', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { access_token: 'token' };
    
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockUser as any, session: mockSession as any },
      error: null,
    });

    const res = await AuthService.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.user?.id).toBe('123');
  });

  it('should call supabase.auth.signUp on register', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: { id: '456' } as any, session: null },
      error: null,
    });

    const res = await AuthService.register({
      email: 'owner@example.com',
      password: 'password123',
      restaurantName: 'Test Bistro',
      fullName: 'John Doe',
    });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'password123',
      options: {
        data: {
          full_name: 'John Doe',
          restaurant_name: 'Test Bistro',
          role: 'ADMIN',
        },
      },
    });
    expect(res.user?.id).toBe('456');
  });
});
