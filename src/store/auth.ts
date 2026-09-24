import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  setToken: (token: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem("access_token"),
  setToken: (token) => {
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
    }
    set({ accessToken: token });
  },
  clear: () => {
    localStorage.removeItem("access_token");
    set({ accessToken: null });
  },
}));
