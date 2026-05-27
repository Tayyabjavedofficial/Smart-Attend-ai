"use client";

import { type ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/lib/api";

/**
 * Wraps the app in a QueryClient and listens for the global `attendai:logout`
 * event that api.ts dispatches when refresh fails. When fired, we clear auth
 * state and navigate to /login.
 *
 * Query defaults are conservative:
 *   - retry only on transient errors (not on 4xx)
 *   - 30s stale time so navigating between pages doesn't re-fetch immediately
 *   - refetchOnWindowFocus disabled (annoying during dev)
 */
export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);

  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                return false;                              // never retry 4xx
              }
              return failureCount < 2;
            },
          },
          mutations: { retry: false },
        },
      })
  );

  useEffect(() => {
    const handler = () => {
      clear();
      router.replace("/login");
    };
    window.addEventListener("attendai:logout", handler);
    return () => window.removeEventListener("attendai:logout", handler);
  }, [clear, router]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
