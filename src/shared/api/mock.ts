import { QueryClient, useSuspenseQuery, type QueryKey } from "@tanstack/react-query";
import { ApiError } from "./http";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Auth / access / missing-object errors will not fix themselves on retry.
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 1,
    },
  },
});

/** Simulated network latency for the in-memory mock backend. */
export function delay<T>(value: T, ms = 120 + Math.random() * 180): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
}

/**
 * Reads mock data through TanStack Query with Suspense, so pages get plain data
 * and the app shell renders one loading state. Swap `fetcher` for a real API
 * call when the backend endpoint exists.
 */
export function useMockQuery<T>(key: QueryKey, fetcher: () => T | Promise<T>): T {
  return useSuspenseQuery({ queryKey: key, queryFn: async () => delay(await fetcher()) }).data;
}
