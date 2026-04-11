"use client";

interface Allocation {
  label: string;
  percentage: number;
  color: string;
}

const chainAllocations: Allocation[] = [
  { label: "Ethereum", percentage: 35, color: "bg-foreground" },
  { label: "Arbitrum", percentage: 25, color: "bg-foreground/60" },
  { label: "Optimism", percentage: 15, color: "bg-foreground/40" },
  { label: "Base", percentage: 15, color: "bg-foreground/25" },
  { label: "Polygon", percentage: 10, color: "bg-foreground/15" },
];

const assetAllocations: Allocation[] = [
  { label: "USDC", percentage: 30, color: "bg-foreground" },
  { label: "ETH / stETH", percentage: 28, color: "bg-foreground/60" },
  { label: "WBTC", percentage: 15, color: "bg-foreground/40" },
  { label: "DAI / sDAI", percentage: 12, color: "bg-foreground/25" },
  { label: "LP Positions", percentage: 15, color: "bg-foreground/15" },
];

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
  const isConnected = true;

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
        <span className="text-sm text-muted">Total Value Locked</span>
        <span className="text-xl font-bold text-foreground tabular-nums">
          $124,832.47
        </span>
      </div>
    </div>
  );
}
