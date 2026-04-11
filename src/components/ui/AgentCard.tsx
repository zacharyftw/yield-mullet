"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface AgentCardProps {
  name: string;
  riskLevel: "low" | "medium" | "high";
  description: string;
  apy: number | null;
  isSelected: boolean;
  isRunning: boolean;
  riskScore?: number | null;
  onSelect: () => void;
  onRun: () => void;
}

const riskLabels = {
  low: "Conservative",
  medium: "Moderate",
  high: "Degen",
};

export default function AgentCard({
  name,
  riskLevel,
  description,
  apy,
  isSelected,
  isRunning,
  riskScore,
  onSelect,
  onRun,
}: AgentCardProps) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative rounded-lg border p-5 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-foreground bg-card shadow-[4px_4px_0px] shadow-foreground"
          : "border-border bg-card hover:border-foreground/30"
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground">{name}</h3>
        <span className="text-xs text-muted font-mono">{riskLabels[riskLevel]}</span>
      </div>

      <p className="text-muted text-sm leading-relaxed mb-5">{description}</p>

      {/* APY + Action */}
      <div className="flex items-end justify-between pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted font-mono uppercase tracking-wider mb-1">
            APY
          </p>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {apy !== null ? `${apy.toFixed(1)}%` : "---"}
          </p>
          {riskScore != null && (
            <p className="text-xs text-muted mt-1 font-mono">
              Risk: {riskScore}/10
            </p>
          )}
        </div>

        {isSelected ? (
          <button
            disabled={isRunning}
            onClick={(e) => {
              e.stopPropagation();
              onRun();
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-foreground text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-foreground/90 transition-colors"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Running...
              </>
            ) : (
              "Run Strategy →"
            )}
          </button>
        ) : (
          <button className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted hover:border-foreground hover:text-foreground transition-colors">
            Select →
          </button>
        )}
      </div>
    </motion.div>
  );
}
