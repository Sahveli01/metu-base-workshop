"use client";

import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { baseSepolia } from "wagmi/chains";

export default function MiniKitProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MiniKitProvider chain={baseSepolia}>{children}</MiniKitProvider>;
}

