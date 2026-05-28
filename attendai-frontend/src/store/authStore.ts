"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (data: { user: User; accessToken: string; refreshToken: string }) => void;
  updateUser: (patch: Partial<User>) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("attendai.accessToken", accessToken);
        }
        set({ user, accessToken, refreshToken });
      },
      updateUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),
      clear: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("attendai.accessToken");
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    { name: "attendai.auth" }
  )
);
