"use client";

import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { useAccount } from "wagmi";
import type { Vault } from "@/types";
import { cleanProtocolName, formatTvl, formatApy } from "@/lib/protocols";
import { chainColors, defaultChainColor } from "@/lib/chainColors";

type SortKey = "apy" | "tvl" | "apy7d" | "protocol" | "chain";
type SortDir = "asc" | "desc";

interface VaultTableProps {
  vaults: Vault[];
  isLoading: boolean;
  onDeposit?: (vault: Vault) => void;
}

const CATEGORIES = ["All", "Stablecoin", "Single", "Multi"] as const;

export default function VaultTable({ vaults, isLoading, onDeposit }: VaultTableProps) {
  const { isConnected } = useAccount();
  const [search, setSearch] = useState("");
  const [selectedChains, setSelectedChains] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("apy");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [minTvl, setMinTvl] = useState(100_000);

  // Available chains from data
  const availableChains = useMemo(() => {
    const chains = new Set(vaults.map(v => v.network));
    return Array.from(chains).sort();
  }, [vaults]);

  // Filter
  const filtered = useMemo(() => {
    return vaults.filter(v => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch =
          v.name.toLowerCase().includes(q) ||
          v.protocol.name.toLowerCase().includes(q) ||
          cleanProtocolName(v.protocol.name).toLowerCase().includes(q) ||
          v.network.toLowerCase().includes(q) ||
          v.underlyingTokens.some(t => t.symbol.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Chain
      if (selectedChains.size > 0 && !selectedChains.has(v.network)) return false;

      // Category
      if (category !== "All") {
        const tag = category.toLowerCase();
        if (!v.tags.some(t => t.toLowerCase() === tag)) return false;
      }

      // Min TVL
      const tvl = parseFloat(v.analytics.tvl.usd);
      if (!isNaN(tvl) && tvl < minTvl) return false;

      return true;
    });
  }, [vaults, search, selectedChains, category, minTvl]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "apy":
          cmp = (a.analytics.apy.total ?? 0) - (b.analytics.apy.total ?? 0);
          break;
        case "tvl":
          cmp = parseFloat(a.analytics.tvl.usd) - parseFloat(b.analytics.tvl.usd);
          break;
        case "apy7d":
          cmp = (a.analytics.apy7d ?? 0) - (b.analytics.apy7d ?? 0);
          break;
        case "protocol":
          cmp = cleanProtocolName(a.protocol.name).localeCompare(cleanProtocolName(b.protocol.name));
          break;
        case "chain":
          cmp = a.network.localeCompare(b.network);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleChain(chain: string) {
    setSelectedChains(prev => {
      const next = new Set(prev);
      if (next.has(chain)) next.delete(chain);
      else next.add(chain);
      return next;
    });
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-muted/40" />;
    return sortDir === "desc"
      ? <ChevronDown className="h-3 w-3 text-foreground" />
      : <ChevronUp className="h-3 w-3 text-foreground" />;
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-white p-8">
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-border/50 rounded-lg" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-border/30 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden">
      {/* Filter Bar */}
      <div className="p-4 border-b border-border space-y-3">
        {/* Search + Category + TVL */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vaults, tokens, protocols..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted/50 outline-none focus:border-primary/50"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  category === cat
                    ? "bg-foreground text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* TVL filter */}
          <select
            value={minTvl}
            onChange={e => setMinTvl(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card text-muted cursor-pointer outline-none"
          >
            <option value={0}>All TVL</option>
            <option value={10000}>TVL &gt; $10K</option>
            <option value={100000}>TVL &gt; $100K</option>
            <option value={1000000}>TVL &gt; $1M</option>
            <option value={10000000}>TVL &gt; $10M</option>
          </select>
        </div>

        {/* Chain pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted mr-1">Chains:</span>
          {availableChains.map(chain => {
            const active = selectedChains.has(chain);
            const style = chainColors[chain] || defaultChainColor;
            return (
              <button
                key={chain}
                onClick={() => toggleChain(chain)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
                  active
                    ? `${style.bg} ${style.text} ring-1 ring-current`
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {chain}
              </button>
            );
          })}
          {selectedChains.size > 0 && (
            <button
              onClick={() => setSelectedChains(new Set())}
              className="px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 py-2 border-b border-border bg-card/50">
        <span className="text-xs text-muted font-mono">
          {sorted.length} vault{sorted.length !== 1 ? "s" : ""}
          {vaults.length !== sorted.length && ` of ${vaults.length}`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider w-[30%]">
                Vault
              </th>
              <th
                onClick={() => toggleSort("chain")}
                className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
              >
                <span className="inline-flex items-center gap-1">Chain <SortIcon col="chain" /></span>
              </th>
              <th
                onClick={() => toggleSort("apy")}
                className="text-right px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
              >
                <span className="inline-flex items-center gap-1 justify-end">APY <SortIcon col="apy" /></span>
              </th>
              <th
                onClick={() => toggleSort("apy7d")}
                className="text-right px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:text-foreground select-none hidden md:table-cell"
              >
                <span className="inline-flex items-center gap-1 justify-end">7d APY <SortIcon col="apy7d" /></span>
              </th>
              <th
                onClick={() => toggleSort("tvl")}
                className="text-right px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
              >
                <span className="inline-flex items-center gap-1 justify-end">TVL <SortIcon col="tvl" /></span>
              </th>
              {isConnected && onDeposit && (
                <th className="px-4 py-3 w-[100px]" />
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted text-sm">
                  No vaults match your filters
                </td>
              </tr>
            ) : (
              sorted.map(vault => {
                const asset = vault.underlyingTokens.map(t => t.symbol).join(" / ") || vault.name;
                const chainStyle = chainColors[vault.network] || defaultChainColor;

                return (
                  <tr
                    key={vault.slug}
                    className="border-b border-border/50 hover:bg-card/50 transition-colors"
                  >
                    {/* Vault info */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {cleanProtocolName(vault.protocol.name)}
                        </span>
                        <span className="text-xs text-muted">{asset}</span>
                      </div>
                    </td>

                    {/* Chain */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${chainStyle.bg} ${chainStyle.text}`}>
                        {vault.network}
                      </span>
                    </td>

                    {/* APY */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatApy(vault.analytics.apy.total)}
                      </span>
                    </td>

                    {/* 7d APY */}
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="text-muted tabular-nums">
                        {formatApy(vault.analytics.apy7d)}
                      </span>
                    </td>

                    {/* TVL */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-muted tabular-nums">
                        {formatTvl(vault.analytics.tvl.usd)}
                      </span>
                    </td>

                    {/* Deposit */}
                    {isConnected && onDeposit && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onDeposit(vault)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-foreground text-white hover:bg-foreground/90 transition-colors"
                        >
                          Deposit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
