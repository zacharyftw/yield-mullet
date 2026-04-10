export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  42161: 'Arbitrum',
  137: 'Polygon',
  10: 'Optimism',
  8453: 'Base',
  43114: 'Avalanche',
};

export const SUPPORTED_CHAIN_IDS = [1, 42161, 137, 10, 8453, 43114] as const;

export function getChainName(chainId: number): string {
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
}
