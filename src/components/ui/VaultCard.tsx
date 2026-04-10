"use client";

import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import type { Vault } from "@/types";

const chainColors: Record<string, { bg: string; text: string }> = {
  Ethereum: { bg: "bg-blue-400/10", text: "text-blue-400" },
  Arbitrum: { bg: "bg-sky-400/10", text: "text-sky-400" },
  Optimism: { bg: "bg-red-400/10", text: "text-red-400" },
  Polygon: { bg: "bg-purple-400/10", text: "text-purple-400" },
  Base: { bg: "bg-blue-500/10", text: "text-blue-500" },
  Avalanche: { bg: "bg-red-500/10", text: "text-red-500" },
  BSC: { bg: "bg-yellow-400/10", text: "text-yellow-400" },
  Gnosis: { bg: "bg-green-500/10", text: "text-green-500" },
  Linea: { bg: "bg-slate-400/10", text: "text-slate-400" },
  Scroll: { bg: "bg-amber-400/10", text: "text-amber-400" },
  Sonic: { bg: "bg-indigo-400/10", text: "text-indigo-400" },
  Mantle: { bg: "bg-gray-400/10", text: "text-gray-400" },
  Berachain: { bg: "bg-orange-400/10", text: "text-orange-400" },
};

function formatTvl(tvlStr: string): string {
  const tvl = parseFloat(tvlStr);
  if (isNaN(tvl)) return "$0";
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(0)}M`;
  if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(0)}K`;
  return `$${tvl.toFixed(0)}`;
}

function formatApy(apy: number | null): string {
  if (apy === null || apy === undefined) return "\u2014";
  return `${apy.toFixed(1)}%`;
}

interface VaultCardProps {
  vault: Vault;
  recommended?: boolean;
  allocationPercent?: number;
  onDeposit?: (vault: Vault) => void;
}

export default function VaultCard({ vault, recommended, allocationPercent, onDeposit }: VaultCardProps) {
  const { isConnected } = useAccount();
  const { protocol, network, analytics, tags, underlyingTokens, name } = vault;
  const apy = analytics.apy.total;
  const tvlStr = analytics.tvl.usd;
  const asset = underlyingTokens.map((t) => t.symbol).join(" / ") || name;

  const chainStyle = chainColors[network] || {
    bg: "bg-gray-400/10",
    text: "text-gray-400",
  };

  return (
    <motion.div
      whileHover={{
        y: -4,
        boxShadow: "0 0 24px rgba(0, 230, 118, 0.06)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`rounded-2xl border bg-card p-5 transition-colors duration-300 hover:border-border-highlight/30 ${
        recommended
          ? "border-primary/50 ring-1 ring-primary/20"
          : "border-border"
      }`}
    >
      {recommended && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
            Recommended
          </span>
          {allocationPercent != null && (
            <span className="text-xs font-bold text-primary tabular-nums">
              {allocationPercent}% allocation
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <h4 className="font-semibold text-foreground">{protocol.name}</h4>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${chainStyle.bg} ${chainStyle.text}`}
          >
            {network}
          </span>
        </div>
        <span className="text-sm font-medium text-muted bg-border/50 px-2 py-0.5 rounded-md truncate max-w-[120px]">
          {asset}
        </span>
      </div>

      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-0.5">
            APY
          </p>
          <p className="text-3xl font-bold text-primary tabular-nums">
            {formatApy(apy)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted uppercase tracking-wider mb-0.5">
            TVL
          </p>
          <p className="text-lg font-semibold text-foreground tabular-nums">
            {formatTvl(tvlStr)}
          </p>
        </div>
      </div>

      {/* 7d APY indicator */}
      {analytics.apy7d !== null && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted">7d APY</span>
            <span className="text-xs font-medium text-muted tabular-nums">
              {formatApy(analytics.apy7d)}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(5, (analytics.apy7d || 0) * 2))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-background/50 px-2.5 py-0.5 text-xs text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Deposit Button */}
      {isConnected && onDeposit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeposit(vault);
          }}
          className="mt-4 w-full py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 hover:border-primary/50 transition-all duration-200"
        >
          Deposit
        </button>
      )}
    </motion.div>
  );
}
