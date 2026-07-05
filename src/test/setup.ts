import '@testing-library/jest-dom';
import { vi } from 'vitest';

export const mockSupabaseResponse = {
  data: [] as any,
  error: null as any,
};

const makeChain = () => {
  const chain: any = {
    select: vi.fn().mockImplementation(() => chain),
    insert: vi.fn().mockImplementation(() => chain),
    update: vi.fn().mockImplementation(() => chain),
    delete: vi.fn().mockImplementation(() => chain),
    eq: vi.fn().mockImplementation(() => chain),
    or: vi.fn().mockImplementation(() => chain),
    order: vi.fn().mockImplementation(() => chain),
    limit: vi.fn().mockImplementation(() => chain),
    single: vi.fn().mockImplementation(() => chain),
    maybeSingle: vi.fn().mockImplementation(() => chain),
    then: vi.fn().mockImplementation((onfulfilled) => {
      return Promise.resolve(onfulfilled(mockSupabaseResponse));
    }),
  };
  return chain;
};

// Mock Supabase client globally
vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getUser: vi.fn(),
        getSession: vi.fn(),
      },
      from: vi.fn().mockImplementation(() => makeChain()),
    },
  };
});
