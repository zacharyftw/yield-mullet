"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import type { AgentDecision, Vault } from "@/types";
import { cleanProtocolName } from "@/lib/protocols";
import { chainColors, defaultChainColor } from "@/lib/chainColors";

const agentLabels: Record<string, string> = {
  stable: "Stable Agent",
  conservative: "Conservative Agent",
  degen: "Degen Agent",
};

interface AgentResultsProps {
  decision: AgentDecision;
  onDeposit?: (vault: Vault) => void;
}

export default function AgentResults({ decision, onDeposit }: AgentResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/30">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {agentLabels[decision.agent] || decision.agent} Recommendation
          </h3>
          <p className="text-xs text-muted">
            Risk Score: {decision.riskScore}/10 &middot; Generated{" "}
            {new Date(decision.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Overall Reasoning */}
      <div className="mb-6 rounded-xl bg-card border border-border p-4">
        <p className="text-sm font-mono text-muted/80 leading-relaxed">
          {decision.reasoning}
        </p>
      </div>

      {/* Allocations */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted uppercase tracking-wider">
          Recommended Allocations
        </h4>
        {decision.selectedVaults.filter(a => a.vault).map((alloc, i) => {
          const vault = alloc.vault;
          const network = vault.network || "Unknown";
          const chainStyle = chainColors[network] || defaultChainColor;
          const apy = vault.analytics?.apy?.total;
          const asset =
            vault.underlyingTokens?.map((t) => t.symbol).join(" / ") ||
            vault.name ||
            "Unknown";

          return (
            <motion.div
              key={`${vault.address}-${i}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {cleanProtocolName(vault.protocol?.name || "Protocol")}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${chainStyle.bg} ${chainStyle.text}`}
                  >
                    {network}
                  </span>
                  <span className="text-xs text-muted">{asset}</span>
                </div>
                <div className="flex items-center gap-3">
                  {apy !== null && apy !== undefined && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {apy.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <span className="text-lg font-bold text-foreground tabular-nums">
                    {alloc.allocationPercent}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted/70 leading-relaxed">
                {alloc.reason}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      {onDeposit && decision.selectedVaults.length > 0 && decision.selectedVaults[0]?.vault && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onDeposit(decision.selectedVaults[0].vault)}
          className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors duration-200"
        >
          Deposit into this strategy
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      )}
    </motion.div>
  );
}
