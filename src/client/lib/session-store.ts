import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TenantState {
  posCart: any[];
  posSelectedTable: string;
  posSelectedCategory: string | null;
  posSearchQuery: string;
  waiterCart: any[];
  waiterSelectedTable: string;
  waiterSelectedCategory: string | null;
  staffSearchQuery: string;
  menuSearchQuery: string;
  reportsFilter: any;
  drafts: Record<string, any>;
}

export interface GlobalState {
  activeConversationId: string | null;
  openDialogId: string | null;
  expandedSections: string[];
  scrollPositions: Record<string, number>;
}

export interface SessionStoreState extends GlobalState {
  tenants: Record<string, TenantState>;
  getTenantState: (tenantId: string) => TenantState;
  updateTenantState: (tenantId: string, updates: Partial<TenantState>) => void;
  clearTenantState: (tenantId: string) => void;
  
  // Global actions
  setActiveConversationId: (id: string | null) => void;
  setOpenDialogId: (id: string | null) => void;
  toggleExpandedSection: (sectionId: string) => void;
  setScrollPosition: (path: string, position: number) => void;
  clearGlobalState: () => void;
}

const initialTenantState = (): TenantState => ({
  posCart: [],
  posSelectedTable: '',
  posSelectedCategory: null,
  posSearchQuery: '',
  waiterCart: [],
  waiterSelectedTable: '',
  waiterSelectedCategory: null,
  staffSearchQuery: '',
  menuSearchQuery: '',
  reportsFilter: null,
  drafts: {},
});

export const useSessionStore = create<SessionStoreState>()(
  persist(
    (set, get) => ({
      tenants: {},
      activeConversationId: null,
      openDialogId: null,
      expandedSections: [],
      scrollPositions: {},

      getTenantState: (tenantId) => {
        if (!tenantId) return initialTenantState();
        return get().tenants[tenantId] || initialTenantState();
      },

      updateTenantState: (tenantId, updates) => {
        if (!tenantId) return;
        set((state) => {
          const current = state.tenants[tenantId] || initialTenantState();
          return {
            tenants: {
              ...state.tenants,
              [tenantId]: {
                ...current,
                ...updates,
              },
            },
          };
        });
      },

      clearTenantState: (tenantId) => {
        if (!tenantId) return;
        set((state) => {
          const { [tenantId]: _, ...rest } = state.tenants;
          return { tenants: rest };
        });
      },

      setActiveConversationId: (id) => set({ activeConversationId: id }),
      setOpenDialogId: (id) => set({ openDialogId: id }),
      toggleExpandedSection: (sectionId) =>
        set((state) => {
          const exists = state.expandedSections.includes(sectionId);
          return {
            expandedSections: exists
              ? state.expandedSections.filter((id) => id !== sectionId)
              : [...state.expandedSections, sectionId],
          };
        }),
      setScrollPosition: (path, position) =>
        set((state) => ({
          scrollPositions: {
            ...state.scrollPositions,
            [path]: position,
          },
        })),
      clearGlobalState: () =>
        set({
          activeConversationId: null,
          openDialogId: null,
          expandedSections: [],
          scrollPositions: {},
        }),
    }),
    {
      name: 'valo-session-persistence',
    }
  )
);
