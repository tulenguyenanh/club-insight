"use client";

import useSWR from "swr";
import { fetchJson } from "../lib/api-client";

/**
 * Reads one API endpoint. While a new range loads, the previous answer stays
 * on screen (dimmed by the caller) instead of flashing a skeleton.
 */
export function useApi<T>(path: string | null) {
  const { data, error, isLoading, isValidating } = useSWR<T, Error>(path, fetchJson<T>, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });
  return { data, error, isLoading, isRefreshing: isValidating && data !== undefined };
}
