"use client";

import { motion } from "framer-motion";
import { Brain, Terminal } from "lucide-react";
import type { AgentDecision } from "@/types";

const agentLabels: Record<string, string> = {
  stable: "Stable Agent",
  conservative: "Conservative Agent",
  degen: "Degen Agent",
};

const agentColors: Record<string, string> = {
  stable: "text-green-400",
  conservative: "text-amber-400",
  degen: "text-red-400",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface ProofOfStrategyProps {
  decisions?: AgentDecision[];
}

export default function ProofOfStrategy({ decisions = [] }: ProofOfStrategyProps) {
  const hasDecisions = decisions.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          Agent Brain &mdash; Strategy Log
        </h3>
        <Terminal className="h-4 w-4 text-muted ml-auto" />
      </div>

      {/* Terminal-style container */}
      <div className="rounded-xl bg-background/80 border border-border p-4 max-h-[420px] overflow-y-auto">
        {!hasDecisions ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="h-8 w-8 text-muted/30 mb-3" />
            <p className="text-sm text-muted/60">
              No agent decisions yet. Select a strategy above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {decisions.map((entry, i) => (
              <motion.div
                key={`${entry.agent}-${entry.timestamp}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="border-l-2 border-border pl-4 pb-2 hover:border-primary/50 transition-colors duration-300"
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-xs font-mono text-muted/60">
                    {formatTime(entry.timestamp)}
                  </span>
                  <span
                    className={`text-xs font-semibold ${agentColors[entry.agent] || "text-primary"}`}
                  >
                    {agentLabels[entry.agent] || entry.agent}
                  </span>
                  <span className="text-xs text-muted/40 ml-auto">
                    Risk: {entry.riskScore}/10
                  </span>
                </div>

                <p className="text-sm font-medium text-foreground mb-1.5">
                  Allocated to {entry.selectedVaults.length} vault
                  {entry.selectedVaults.length !== 1 ? "s" : ""}
                </p>

                <p className="text-xs font-mono leading-relaxed text-muted/70 bg-card/50 rounded-lg px-3 py-2 border border-border/50 mb-2">
                  {entry.reasoning}
                  <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 align-middle animate-blink" />
                </p>

                {/* Allocation summary */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {entry.selectedVaults.map((alloc, j) => (
                    <span
                      key={j}
                      className="text-xs px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary"
                    >
                      {alloc.vault.protocol?.name || "Vault"}{" "}
                      {alloc.allocationPercent}%
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
