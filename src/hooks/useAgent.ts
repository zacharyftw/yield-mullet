"use client";

import { useMutation } from "@tanstack/react-query";
import type { AgentDecision, AgentType } from "@/types";

export function useAgent(agentType: AgentType | null) {
  const mutation = useMutation<AgentDecision, Error>({
    mutationFn: async () => {
      if (!agentType) throw new Error("No agent type selected");

      const res = await fetch(`/api/agents/${agentType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Agent request failed: ${res.status}`);
      }

      return res.json();
    },
  });

  return {
    decision: mutation.data ?? null,
    isLoading: mutation.isPending,
    error: mutation.error,
    runAgent: mutation.mutate,
    reset: mutation.reset,
  };
}
