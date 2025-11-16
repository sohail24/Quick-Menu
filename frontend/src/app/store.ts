import { create } from "zustand";

type User = { id?: string; email?: string; name?: string; role?: string };

type AuthState = {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("qm_token"),
  user: null,
  setToken: (token) => {
    if (token) localStorage.setItem("qm_token", token);
    else localStorage.removeItem("qm_token");
    set({ token });
  },
  setUser: (user) => set({ user }),
}));
