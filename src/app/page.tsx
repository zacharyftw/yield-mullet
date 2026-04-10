"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Shield,
  Flame,
  ExternalLink,
  Layers,
  Globe,
  Box,
  Brain,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import AgentCard from "@/components/ui/AgentCard";
import VaultCard from "@/components/ui/VaultCard";
import DepositModal from "@/components/deposit/DepositModal";
import ProofOfStrategy from "@/components/dashboard/ProofOfStrategy";
import AgentResults from "@/components/dashboard/AgentResults";
import PortfolioBreakdown from "@/components/dashboard/PortfolioBreakdown";
import { useVaults } from "@/hooks/useVaults";
import { useAgent } from "@/hooks/useAgent";
import type { Vault, AgentDecision, AgentType } from "@/types";

const agents = [
  {
    id: "stable" as AgentType,
    name: "Stable Agent",
    riskLevel: "low" as const,
    description:
      "Focuses on blue-chip stablecoin yields across battle-tested lending protocols. Prioritizes capital preservation with steady, predictable returns. Targets Aave, Compound, and Spark.",
    apy: 5.2,
    icon: Shield,
  },
  {
    id: "conservative" as AgentType,
    name: "Conservative Agent",
    riskLevel: "medium" as const,
    description:
      "Balances ETH staking, liquid staking derivatives, and moderate DeFi strategies. Accepts some volatility for higher yields. Operates across Lido, Rocket Pool, and Pendle.",
    apy: 8.7,
    icon: Zap,
  },
  {
    id: "degen" as AgentType,
    name: "Degen Agent",
    riskLevel: "high" as const,
    description:
      "Hunts for the highest yields through concentrated liquidity, leveraged farming, and new protocol incentives. High risk, high reward. Active on Uniswap V4, GMX, and emerging protocols.",
    apy: 24.3,
    icon: Flame,
  },
];

const stats = [
  { label: "Vaults Tracked", value: "672+", icon: Layers },
  { label: "Chains", value: "21", icon: Globe },
  { label: "Protocols", value: "20+", icon: Box },
];

function VaultSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-24 rounded-md animate-shimmer" />
        <div className="h-4 w-16 rounded-md animate-shimmer" />
      </div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="h-3 w-8 rounded mb-1 animate-shimmer" />
          <div className="h-8 w-20 rounded animate-shimmer" />
        </div>
        <div className="text-right">
          <div className="h-3 w-8 rounded mb-1 animate-shimmer" />
          <div className="h-6 w-16 rounded animate-shimmer" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-16 rounded-full animate-shimmer" />
        <div className="h-5 w-12 rounded-full animate-shimmer" />
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [depositVault, setDepositVault] = useState<Vault | null>(null);
  const { vaults, isLoading, error } = useVaults({ sortBy: "apy" });
  const { decision, isLoading: agentLoading, error: agentError, runAgent, reset } = useAgent(selectedAgent);

  // Track latest decision per agent type for risk score display
  const latestDecisionByAgent = useMemo(() => {
    const map: Partial<Record<AgentType, AgentDecision>> = {};
    for (const d of decisions) {
      map[d.agent] = d;
    }
    return map;
  }, [decisions]);

  // Build a set of recommended vault addresses from the latest decision
  const recommendedVaults = useMemo(() => {
    if (!decision) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const alloc of decision.selectedVaults) {
      if (alloc.vault?.address) {
        map.set(alloc.vault.address, alloc.allocationPercent);
      }
    }
    return map;
  }, [decision]);

  // Display up to 12 vaults, recommended ones first
  const displayedVaults = useMemo(() => {
    const sorted = [...vaults];
    if (recommendedVaults.size > 0) {
      sorted.sort((a, b) => {
        const aRec = recommendedVaults.has(a.address) ? 1 : 0;
        const bRec = recommendedVaults.has(b.address) ? 1 : 0;
        return bRec - aRec;
      });
    }
    return sorted.slice(0, 12);
  }, [vaults, recommendedVaults]);

  function handleRunAgent() {
    runAgent(undefined, {
      onSuccess: (data) => {
        setDecisions((prev) => [data, ...prev]);
      },
    });
  }

  function handleSelectAgent(agentId: AgentType) {
    if (selectedAgent === agentId) {
      setSelectedAgent(null);
      reset();
    } else {
      setSelectedAgent(agentId);
      reset();
    }
  }

  return (
    <div className="relative flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 pt-24 pb-20 sm:px-6 lg:px-8">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,230,118,0.08)_0%,_transparent_60%)]" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[100px]" />

          <div className="relative mx-auto max-w-4xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl font-bold tracking-tight sm:text-7xl"
            >
              <span className="bg-gradient-to-r from-primary via-emerald-300 to-secondary bg-clip-text text-transparent">
                Yield Mullet
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-5 text-xl font-medium italic text-primary/70"
            >
              &ldquo;Business in the front, yield in the back.&rdquo;
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-5 max-w-2xl mx-auto text-base leading-relaxed text-muted"
            >
              An AI agent swarm that continuously scans, evaluates, and
              rebalances your DeFi positions across chains. Choose your risk
              appetite and let the agents do the rest &mdash; transparent
              reasoning, on-chain execution, no black boxes.
            </motion.p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-10 flex items-center justify-center gap-8 sm:gap-12"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1">
                  <stat.icon className="h-4 w-4 text-primary/60 mb-1" />
                  <span className="text-2xl font-bold text-foreground tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-xs text-muted">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Agent Strategy Cards */}
        <section id="strategy" className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Choose Your Strategy
              </h2>
              <p className="text-sm text-muted mb-8">
                Each agent runs a distinct strategy calibrated to a different
                risk profile.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              {agents.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <AgentCard
                    name={agent.name}
                    riskLevel={agent.riskLevel}
                    description={agent.description}
                    apy={agent.apy}
                    isSelected={selectedAgent === agent.id}
                    isRunning={agentLoading && selectedAgent === agent.id}
                    riskScore={latestDecisionByAgent[agent.id]?.riskScore ?? null}
                    onSelect={() => handleSelectAgent(agent.id)}
                    onRun={handleRunAgent}
                  />
                </motion.div>
              ))}
            </div>

            {/* Agent Loading State */}
            <AnimatePresence>
              {agentLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="mt-8 flex items-center justify-center gap-3 py-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Brain className="h-6 w-6 text-primary" />
                  </motion.div>
                  <p className="text-sm text-muted">
                    Agent analyzing vaults and computing optimal allocation...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Agent Error */}
            <AnimatePresence>
              {agentError && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="mt-6 rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-400"
                >
                  Agent error: {agentError.message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Agent Results */}
            <AnimatePresence>
              {decision && !agentLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="mt-8"
                >
                  <AgentResults decision={decision} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Vaults */}
        <section id="vaults" className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Top Vaults
              </h2>
              <p className="text-sm text-muted mb-8">
                Live yield sources being monitored and allocated to by the agent
                swarm.
                {recommendedVaults.size > 0 && (
                  <span className="text-primary ml-2">
                    ({recommendedVaults.size} recommended by agent)
                  </span>
                )}
              </p>
            </motion.div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-400">
                Failed to load vaults: {error.message}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <VaultSkeleton key={i} />
                  ))
                : displayedVaults.map((vault) => (
                    <VaultCard
                      key={vault.slug}
                      vault={vault}
                      recommended={recommendedVaults.has(vault.address)}
                      allocationPercent={recommendedVaults.get(vault.address)}
                      onDeposit={setDepositVault}
                    />
                  ))}
            </div>

            {!isLoading && displayedVaults.length === 0 && !error && (
              <p className="text-center text-muted text-sm mt-8">
                No vaults available at the moment.
              </p>
            )}
          </div>
        </section>

        {/* Dashboard Section */}
        <section id="dashboard" className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Agent Activity
              </h2>
              <p className="text-sm text-muted mb-8">
                Real-time portfolio overview and agent decision transparency.
              </p>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-2">
              <PortfolioBreakdown />
              <ProofOfStrategy decisions={decisions} />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted/60">
            Built for DeFi Mullet Hackathon &mdash; AI-powered yield
            aggregation on Starknet &amp; EVM chains.
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted/60 hover:text-primary transition-colors duration-200"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
      </footer>

      {/* Deposit Modal */}
      {depositVault && (
        <DepositModal
          vault={depositVault}
          isOpen={!!depositVault}
          onClose={() => setDepositVault(null)}
        />
      )}
    </div>
  );
}
