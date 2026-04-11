"use client";

import { useAccount } from "wagmi";
import { usePortfolio } from "@/hooks/usePortfolio";

interface Allocation {
  label: string;
  percentage: number;
  color: string;
}

const opacityScale = ["bg-foreground", "bg-foreground/60", "bg-foreground/40", "bg-foreground/25", "bg-foreground/15"];

function SegmentedBar({ allocations }: { allocations: Allocation[] }) {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-border">
      {allocations.map((a) => (
        <div
          key={a.label}
          className={`${a.color} first:rounded-l-full last:rounded-r-full`}
          style={{ width: `${a.percentage}%` }}
          title={`${a.label}: ${a.percentage}%`}
        />
      ))}
    </div>
  );
}

function Legend({ allocations }: { allocations: Allocation[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
      {allocations.map((a) => (
        <div key={a.label} className="flex items-center gap-1.5 text-sm">
          <span className={`inline-block h-2 w-2 rounded-full ${a.color}`} />
          <span className="text-muted">{a.label}</span>
          <span className="font-medium text-foreground tabular-nums font-mono text-xs">
            {a.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PortfolioBreakdown() {
  const { address, isConnected } = useAccount();
  const { positions, isLoading } = usePortfolio(address);

  if (!isConnected) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 flex flex-col items-center justify-center min-h-[300px]">
        <p className="text-muted text-sm mb-2">No wallet connected</p>
        <p className="text-muted/60 text-xs">
          Connect your wallet to see portfolio breakdown
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 flex flex-col items-center justify-center min-h-[300px]">
        <p className="text-muted text-sm">Loading portfolio...</p>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 flex flex-col items-center justify-center min-h-[300px]">
        <p className="text-muted text-sm mb-2">No active positions</p>
        <p className="text-muted/60 text-xs">
          Deposit into a vault to see your portfolio here
        </p>
      </div>
    );
  }

  const totalUsd = positions.reduce((sum, p) => sum + parseFloat(p.balanceUsd || "0"), 0);

  const chainTotals: Record<string, number> = {};
  const assetTotals: Record<string, number> = {};

  for (const pos of positions) {
    const usd = parseFloat(pos.balanceUsd || "0");
    const chain = pos.vault.network || "Unknown";
    const asset = pos.vault.underlyingTokens?.map(t => t.symbol).join(" / ") || pos.vault.name || "Unknown";
    chainTotals[chain] = (chainTotals[chain] || 0) + usd;
    assetTotals[asset] = (assetTotals[asset] || 0) + usd;
  }

  function toAllocations(totals: Record<string, number>): Allocation[] {
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (totalUsd <= 0) {
      return entries.map(([label], i) => ({
        label, percentage: 0,
        color: opacityScale[i] || opacityScale[opacityScale.length - 1],
      }));
    }

    // Largest remainder method — guarantees sum is exactly 100
    const exact = entries.map(([, usd]) => (usd / totalUsd) * 100);
    const floored = exact.map(Math.floor);
    let remainder = 100 - floored.reduce((s, v) => s + v, 0);
    const remainders = exact.map((v, i) => ({ i, r: v - floored[i] }));
    remainders.sort((a, b) => b.r - a.r);
    for (const { i } of remainders) {
      if (remainder <= 0) break;
      floored[i]++;
      remainder--;
    }

    return entries.map(([label], i) => ({
      label,
      percentage: floored[i],
      color: opacityScale[i] || opacityScale[opacityScale.length - 1],
    }));
  }

  const chainAllocations = toAllocations(chainTotals);
  const assetAllocations = toAllocations(assetTotals);

  return (
    <div className="rounded-lg border border-border bg-white p-6">
      <h3 className="text-base font-semibold text-foreground mb-6">
        Portfolio Breakdown
      </h3>

      {/* Chain allocation */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-muted font-mono mb-2">
          By Chain
        </p>
        <SegmentedBar allocations={chainAllocations} />
        <Legend allocations={chainAllocations} />
      </div>

      {/* Asset allocation */}
      <div>
        <p className="text-xs uppercase tracking-wider text-muted font-mono mb-2">
          By Asset
        </p>
        <SegmentedBar allocations={assetAllocations} />
        <Legend allocations={assetAllocations} />
      </div>

      {/* Total value */}
      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-sm text-muted">Total Value</span>
        <span className="text-xl font-bold text-foreground tabular-nums">
          ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
