"use client";

import { motion } from "framer-motion";
import { Shield, Scale, Flame, Loader2, type LucideIcon } from "lucide-react";

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

const riskConfig = {
  low: {
    label: "Conservative",
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/30",
    icon: Shield,
  },
  medium: {
    label: "Moderate",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    icon: Scale,
  },
  high: {
    label: "Degen",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: Flame,
  },
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
  const risk = riskConfig[riskLevel];
  const Icon: LucideIcon = risk.icon;

  return (
    <motion.div
      whileHover={{
        scale: 1.025,
        boxShadow: "0 0 30px rgba(0, 230, 118, 0.08)",
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative rounded-2xl border p-6 cursor-pointer transition-all duration-300 ${
        isSelected
          ? "border-primary bg-card animate-glow-pulse"
          : "border-border bg-card hover:border-border-highlight/40"
      }`}
      onClick={onSelect}
    >
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 w-3 h-3 rounded-full bg-primary animate-pulse"
        />
      )}

      {/* Icon + Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-xl ${risk.bg} ${risk.border} border`}
        >
          <Icon className={`h-5 w-5 ${risk.color}`} />
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${risk.bg} ${risk.color} ${risk.border} border`}
          >
            {risk.label}
          </span>
        </div>
      </div>

      <p className="text-muted text-sm leading-relaxed mb-6">{description}</p>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            Current APY
          </p>
          <p className="text-3xl font-bold text-primary tabular-nums">
            {apy !== null ? `${apy.toFixed(1)}%` : "---"}
          </p>
          {riskScore != null && (
            <p className="text-xs text-muted mt-1">
              Agent Risk Score:{" "}
              <span className="text-foreground font-medium">{riskScore}/10</span>
            </p>
          )}
        </div>

        {isSelected ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isRunning}
            onClick={(e) => {
              e.stopPropagation();
              onRun();
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-primary text-background shadow-[0_0_16px_rgba(0,230,118,0.3)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              "Run Strategy"
            )}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-border text-foreground hover:bg-primary/20 hover:text-primary"
          >
            Select Strategy
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
