"use client";

import { useQuery } from "@tanstack/react-query";
import type { AgentDecision, AgentType } from "@/types";

type StrategiesResponse = Partial<Record<AgentType, AgentDecision>>;

export function useStrategies() {
  return useQuery<StrategiesResponse>({
    queryKey: ["strategies"],
    queryFn: async () => {
      const res = await fetch("/api/strategies");
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    refetchOnWindowFocus: false,
  });
}
