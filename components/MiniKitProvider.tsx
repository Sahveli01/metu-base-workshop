"use client";

import { MiniKitProvider } from "@coinbase/onchainkit/minikit";

export default function MiniKitProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MiniKitProvider>{children}</MiniKitProvider>;
}

