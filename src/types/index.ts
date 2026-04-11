// Vault from LI.FI Earn API — matches actual response shape
export interface Vault {
  name: string;
  slug: string;
  address: string;
  chainId: number;
  network: string;
  tags: string[];
  lpTokens: string[];
  protocol: {
    name: string;
    url?: string;
  };
  provider: string;
  syncedAt: string;
  description?: string;
  analytics: {
    apy: {
      base: number | null;
      total: number | null;
      reward: number | null;
    };
    tvl: {
      usd: string; // NOTE: string not number per API
    };
    apy1d: number | null;
    apy7d: number | null;
    apy30d: number | null;
    updatedAt: string;
  };
  redeemPacks: Array<{ name: string; stepsType: string }>;
  depositPacks: Array<{ name: string; stepsType: string }>;
  isRedeemable: boolean;
  isTransactional: boolean;
  underlyingTokens: Array<{
    symbol: string;
    address: string;
    decimals: number;
  }>;
}

export interface VaultsPageResponse {
  data: Vault[];
  nextCursor?: string;
  total?: number;
}

export interface VaultsResponse {
  data: Vault[];
  total: number;
}

// Agent types
export type RiskLevel = 'low' | 'medium' | 'high';
export type AgentType = 'stable' | 'conservative' | 'degen';

export interface AgentDecision {
  agent: AgentType;
  timestamp: string;
  selectedVaults: VaultAllocation[];
  reasoning: string;
  riskScore: number;
}

export interface VaultAllocation {
  vault: Vault;
  allocationPercent: number;
  reason: string;
}

export interface ComposerQuote {
  transactionRequest: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
    chainId: number;
  };
  estimate: {
    fromAmount: string;
    toAmount: string;
    gasCosts: Array<{ amount: string; token: { symbol: string } }>;
  };
}

export interface PortfolioPosition {
  vault: Vault;
  balance: string;
  balanceUsd: string;
}

export interface AgentConfig {
  type: AgentType;
  name: string;
  riskLevel: RiskLevel;
  systemPrompt: string;
}
