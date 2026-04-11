import type { Vault, VaultsPageResponse, VaultsResponse, ComposerQuote, PortfolioPosition } from '@/types';

const EARN_BASE_URL = 'https://earn.li.fi';
const COMPOSER_BASE_URL = 'https://li.quest';

async function fetchVaultsPage(params?: {
  chainId?: number;
  asset?: string;
  minTvl?: number;
  sortBy?: string;
  cursor?: string;
}): Promise<VaultsPageResponse> {
  const url = new URL(`${EARN_BASE_URL}/v1/earn/vaults`);
  if (params?.chainId) url.searchParams.set('chainId', String(params.chainId));
  if (params?.asset) url.searchParams.set('asset', params.asset);
  if (params?.minTvl) url.searchParams.set('minTvl', String(params.minTvl));
  if (params?.sortBy) url.searchParams.set('sortBy', params.sortBy);
  if (params?.cursor) url.searchParams.set('cursor', params.cursor);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Earn API error: ${res.status}`);
  return res.json() as Promise<VaultsPageResponse>;
}

export async function fetchVaults(params?: {
  chainId?: number;
  asset?: string;
  minTvl?: number;
  sortBy?: string;
}): Promise<VaultsResponse> {
  const allVaults: Vault[] = [];
  let cursor: string | undefined;
  let total = 0;

  do {
    const page = await fetchVaultsPage({ ...params, cursor });
    allVaults.push(...(page.data ?? []));
    total = page.total ?? allVaults.length;
    cursor = page.nextCursor;
  } while (cursor);

  return { data: allVaults, total };
}

export async function fetchPortfolio(userAddress: string): Promise<PortfolioPosition[]> {
  const res = await fetch(`${EARN_BASE_URL}/v1/earn/portfolio/${userAddress}/positions`);
  if (!res.ok) throw new Error(`Portfolio error: ${res.status}`);
  return res.json() as Promise<PortfolioPosition[]>;
}

export async function getComposerQuote(params: {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAddress: string;
  toAddress: string;
  fromAmount: string;
  slippage?: number;
}): Promise<ComposerQuote> {
  const url = new URL(`${COMPOSER_BASE_URL}/v1/quote`);
  url.searchParams.set('fromChain', String(params.fromChain));
  url.searchParams.set('toChain', String(params.toChain));
  url.searchParams.set('fromToken', params.fromToken);
  url.searchParams.set('toToken', params.toToken);
  url.searchParams.set('fromAddress', params.fromAddress);
  url.searchParams.set('toAddress', params.toAddress);
  url.searchParams.set('fromAmount', params.fromAmount);
  url.searchParams.set('slippage', String(params.slippage ?? 0.005));
  url.searchParams.set('integrator', 'Mullet');

  const apiKey = process.env.LIFI_API_KEY;
  if (!apiKey) throw new Error('LIFI_API_KEY not set');

  const res = await fetch(url.toString(), {
    headers: { 'x-lifi-api-key': apiKey },
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Composer error: ${res.status} - ${error}`);
  }
  return res.json() as Promise<ComposerQuote>;
}
