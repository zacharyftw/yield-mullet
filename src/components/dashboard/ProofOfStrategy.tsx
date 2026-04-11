"use client";

import { motion } from "framer-motion";
import type { AgentDecision } from "@/types";

const protocolNames: Record<string, string> = {
  "morpho-v1": "Morpho", "morpho-v2": "Morpho", "aave-v3": "Aave V3",
  "yo-protocol": "YO Protocol", "pendle": "Pendle", "spark": "Spark",
  "fluid": "Fluid", "euler-v2": "Euler", "ethena": "Ethena",
  "etherfi": "Ether.fi", "maple": "Maple", "compound-v3": "Compound",
  "neverland": "Neverland", "concrete": "Concrete", "kelp": "Kelp",
  "kinetiq": "Kinetiq", "hyperlend": "HyperLend", "hypurrfi": "Hypurrfi",
  "tokemak": "Tokemak", "upshift": "Upshift", "usdai": "USDAi",
  "avon": "Avon", "felix-vanilla": "Felix",
};

function cleanProtocolName(slug: string): string {
  return protocolNames[slug] || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const agentLabels: Record<string, string> = {
  stable: "Stable Agent",
  conservative: "Conservative Agent",
  degen: "Degen Agent",
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
    <div className="rounded-lg border border-border bg-white p-6 overflow-hidden">
      <h3 className="text-base font-semibold text-foreground mb-6">
        Strategy Log
      </h3>

      <div className="rounded-lg border border-border p-4 max-h-[420px] overflow-y-auto">
        {!hasDecisions ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted">
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
                className="border-l-2 border-border pl-4 pb-2 hover:border-foreground/30 transition-colors duration-200"
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-xs font-mono text-muted">
                    {formatTime(entry.timestamp)}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {agentLabels[entry.agent] || entry.agent}
                  </span>
                  <span className="text-xs text-muted font-mono ml-auto">
                    Risk: {entry.riskScore}/10
                  </span>
                </div>

                <p className="text-sm font-medium text-foreground mb-1.5">
                  Allocated to {entry.selectedVaults.length} vault
                  {entry.selectedVaults.length !== 1 ? "s" : ""}
                </p>

                <p className="text-xs font-mono leading-relaxed text-muted rounded-lg px-3 py-2 bg-card border border-border mb-2">
                  {entry.reasoning}
                  <span className="inline-block w-1 h-3 bg-foreground ml-1 align-middle animate-blink" />
                </p>

                {/* Allocation summary */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {entry.selectedVaults.map((alloc, j) => (
                    <span
                      key={j}
                      className="text-xs px-2 py-0.5 rounded border border-border text-foreground font-mono"
                    >
                      {cleanProtocolName(alloc.vault.protocol?.name || "Vault")}{" "}
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
