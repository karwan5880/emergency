"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
}

const client = new ConvexReactClient(convexUrl);

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
