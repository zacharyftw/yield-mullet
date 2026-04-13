"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http } from "wagmi";
import {
  RainbowKitProvider,
  getDefaultConfig,
  lightTheme,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import {
  arbitrum,
  optimism,
  polygon,
  base,
  mainnet,
  avalanche,
} from "wagmi/chains";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import "@rainbow-me/rainbowkit/styles.css";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
if (!projectId) {
  console.warn("NEXT_PUBLIC_WC_PROJECT_ID is not set — WalletConnect will not work");
}

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const alchemyUrl = (network: string) =>
  alchemyKey ? `https://${network}.g.alchemy.com/v2/${alchemyKey}` : undefined;

const config = getDefaultConfig({
  appName: "Yield Mullet",
  projectId: projectId || "MISSING_PROJECT_ID",
  chains: [mainnet, arbitrum, optimism, polygon, base, avalanche],
  transports: {
    [mainnet.id]: http(alchemyUrl("eth-mainnet")),
    [arbitrum.id]: http(alchemyUrl("arb-mainnet")),
    [optimism.id]: http(alchemyUrl("opt-mainnet")),
    [polygon.id]: http(alchemyUrl("polygon-mainnet")),
    [base.id]: http(alchemyUrl("base-mainnet")),
    [avalanche.id]: http(alchemyUrl("avax-mainnet")),
  },
  ssr: false,
});

const rkLight = lightTheme({
  accentColor: "#3F49E1",
  accentColorForeground: "#ffffff",
  borderRadius: "medium",
});

const rkDark = darkTheme({
  accentColor: "#6366f1",
  accentColorForeground: "#ffffff",
  borderRadius: "medium",
});

export default function ProvidersInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const { theme } = useTheme();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme === "dark" ? rkDark : rkLight}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
