export const COMMON_TOKENS: Record<number, { usdc: string; usdt: string; native: string }> = {
  1: { usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7', native: '0x0000000000000000000000000000000000000000' },
  42161: { usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', native: '0x0000000000000000000000000000000000000000' },
  137: { usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', native: '0x0000000000000000000000000000000000000000' },
  10: { usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', usdt: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', native: '0x0000000000000000000000000000000000000000' },
  8453: { usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', usdt: '0x0000000000000000000000000000000000000000', native: '0x0000000000000000000000000000000000000000' },
  43114: { usdc: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', usdt: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', native: '0x0000000000000000000000000000000000000000' },
};

export const TOKEN_DECIMALS: Record<string, number> = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
  MATIC: 18,
  AVAX: 18,
};

export interface TokenOption {
  symbol: string;
  address: string;
  decimals: number;
}

export function getTokensForChain(chainId: number): TokenOption[] {
  const tokens = COMMON_TOKENS[chainId];
  if (!tokens) return [];

  const result: TokenOption[] = [];

  if (tokens.usdc !== '0x0000000000000000000000000000000000000000') {
    result.push({ symbol: 'USDC', address: tokens.usdc, decimals: 6 });
  }
  if (tokens.usdt !== '0x0000000000000000000000000000000000000000') {
    result.push({ symbol: 'USDT', address: tokens.usdt, decimals: 6 });
  }

  // Native token
  const nativeSymbol = chainId === 137 ? 'MATIC' : chainId === 43114 ? 'AVAX' : 'ETH';
  result.push({ symbol: nativeSymbol, address: tokens.native, decimals: 18 });

  return result;
}
