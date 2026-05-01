"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { ClientApiError } from "@/lib/client/fetcher";
import type { Order, Wallet } from "@/lib/client/types";

export function useCheckout() {
  const { mutate } = useSWRConfig();
  const [isProcessing, setProcessing] = useState(false);
  const [lastError, setError] = useState<ClientApiError | null>(null);

  const checkout = async (): Promise<{ order: Order; wallet: Wallet }> => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ClientApiError(
          res.status,
          body?.error?.code ?? "UNKNOWN",
          body?.error?.message,
        );
      }
      const data = (await res.json()) as { order: Order; wallet: Wallet };
      // bust caches
      await Promise.all([mutate("/api/cart"), mutate("/api/wallet"), mutate("/api/orders")]);
      return data;
    } catch (e) {
      setError(e as ClientApiError);
      throw e;
    } finally {
      setProcessing(false);
    }
  };

  return { checkout, isProcessing, lastError };
}
