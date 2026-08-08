"use client";

import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
          dedupingInterval: 15_000,
          errorRetryCount: 2,
          keepPreviousData: true,
        }}
      >
        {children}
      </SWRConfig>
    </SessionProvider>
  );
}
