"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Brain } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import AgentCard from "@/components/ui/AgentCard";
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
  },
  {
    id: "conservative" as AgentType,
    name: "Conservative Agent",
    riskLevel: "medium" as const,
    description:
      "Balances ETH staking, liquid staking derivatives, and moderate DeFi strategies. Accepts some volatility for higher yields. Operates across Lido, Rocket Pool, and Pendle.",
  },
  {
    id: "degen" as AgentType,
    name: "Degen Agent",
    riskLevel: "high" as const,
    description:
      "Hunts for the highest yields through concentrated liquidity, leveraged farming, and new protocol incentives. High risk, high reward. Active on Uniswap V4, GMX, and emerging protocols.",
  },
];

export default function Home() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [depositVault, setDepositVault] = useState<Vault | null>(null);
  const { vaults } = useVaults({ sortBy: "apy" });
  const { decision, isLoading: agentLoading, error: agentError, runAgent, reset } = useAgent(selectedAgent);

  // Track latest decision per agent type for risk score display
  const latestDecisionByAgent = useMemo(() => {
    const map: Partial<Record<AgentType, AgentDecision>> = {};
    for (const d of decisions) {
      map[d.agent] = d;
    }
    return map;
  }, [decisions]);

  // Compute live stats from vault data
  const liveStats = useMemo(() => {
    const chains = new Set(vaults.map(v => v.network));
    const protocols = new Set(vaults.map(v => v.protocol.name));
    return {
      vaults: vaults.length,
      chains: chains.size,
      protocols: protocols.size,
    };
  }, [vaults]);

  // Compute median APY per risk tier from real vault data
  const agentApys = useMemo(() => {
    if (vaults.length === 0) return { stable: null, conservative: null, degen: null };

    // Filter to vaults with meaningful APY (>0.5%) for representative numbers
    const apys = vaults
      .map(v => v.analytics.apy.total)
      .filter((a): a is number => a !== null && a > 0.5)
      .sort((a, b) => a - b);

    if (apys.length === 0) return { stable: null, conservative: null, degen: null };

    const third = Math.floor(apys.length / 3);
    const median = (arr: number[]) => arr[Math.floor(arr.length / 2)] ?? null;

    return {
      stable: median(apys.slice(0, third)),
      conservative: median(apys),
      degen: median(apys.slice(-third)),
    };
  }, [vaults]);


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
        <section className="px-4 pt-32 pb-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl font-bold tracking-tight sm:text-7xl text-foreground"
            >
              Yield Mullet
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-xl font-medium italic text-muted"
            >
              &ldquo;Business in the front, yield in the back.&rdquo;
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 max-w-2xl mx-auto text-base leading-relaxed text-muted/70"
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
              className="mt-14 flex items-center justify-center gap-12 sm:gap-16"
            >
              {[
                { label: "Vaults Tracked", value: liveStats.vaults > 0 ? `${liveStats.vaults}` : "—" },
                { label: "Chains", value: liveStats.chains > 0 ? `${liveStats.chains}` : "—" },
                { label: "Protocols", value: liveStats.protocols > 0 ? `${liveStats.protocols}` : "—" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-bold text-foreground tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-xs text-muted font-mono">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Agent Strategy Cards */}
        <section id="strategy" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xs font-mono text-muted/40 mb-3 tracking-wider">//strategies</p>
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Choose Your Strategy
              </h2>
              <p className="text-sm text-muted/60 mb-12">
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
                    apy={agentApys[agent.id]}
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
                  <AgentResults decision={decision} onDeposit={setDepositVault} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>


        {/* Dashboard Section */}
        <section id="dashboard" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xs font-mono text-muted/40 mb-3 tracking-wider">//dashboard</p>
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Agent Activity
              </h2>
              <p className="text-sm text-muted/60 mb-12">
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
      <footer className="relative z-10 border-t border-border py-10 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted/60">
            Built for DeFi Mullet Hackathon &mdash; AI-powered yield
            aggregation on Starknet &amp; EVM chains.
          </p>
          <a
            href="https://github.com/zacharyftw/yield-mullet"
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
