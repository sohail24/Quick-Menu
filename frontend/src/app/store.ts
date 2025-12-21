// src/app/store.ts
import { create } from 'zustand';
import { jwtDecode } from '../lib/jwt';

type User = { sub?: string; name?: string; email?: string; roles?: string[]; role?: string } | null;

type AuthState = {
  token: string | null;
  user: User;
  setToken: (token: string | null) => void;
  setUser: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => {
  const initialToken = localStorage.getItem('qm_token');
  const initialUser = initialToken ? jwtDecode(initialToken) : null;
  return {
    token: initialToken,
    user: initialUser,
    setToken: (token) => {
      if (token) {
        localStorage.setItem('qm_token', token);
        const decoded = jwtDecode(token);
        set({ token, user: decoded });
      } else {
        localStorage.removeItem('qm_token');
        set({ token: null, user: null });
      }
    },
    setUser: (user) => set({ user }),
    logout: () => {
      localStorage.removeItem('qm_token');
      set({ token: null, user: null });
      // optional: reload or redirect handled by components
    },
  };
});

type UIState = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
}));
