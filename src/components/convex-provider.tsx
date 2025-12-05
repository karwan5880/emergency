"use client";

import { ConvexProvider as ConvexProviderBase } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
}

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  
  const convexClient = useMemo(
    () =>
      new ConvexReactClient(convexUrl, {
        async fetch(url, options) {
          const token = await getToken();
          options = options || {};
          options.headers = {
            ...options.headers,
            Authorization: token ? `Bearer ${token}` : undefined,
          };
          return fetch(url, options);
        },
      }),
    [getToken]
  );

  return <ConvexProviderBase client={convexClient}>{children}</ConvexProviderBase>;
}
