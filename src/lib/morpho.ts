import type { Vault } from '@/types';

const MORPHO_API_URL = 'https://api.morpho.org/graphql';
const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

interface MorphoVaultState {
  apy: number;
  netApy: number;
  totalAssetsUsd: number;
}

/**
 * Fetch real APY data for Morpho vaults by their addresses.
 * Queries each vault individually since a single NOT_FOUND kills a batched query.
 * Returns a map of lowercased address → { apy, netApy, totalAssetsUsd }.
 */
export async function fetchMorphoApys(
  vaults: Array<{ address: string; chainId: number }>
): Promise<Map<string, MorphoVaultState>> {
  const result = new Map<string, MorphoVaultState>();
  if (vaults.length === 0) return result;

  const fetches = vaults.map(async (v) => {
    // Validate address format to prevent GraphQL injection
    if (!ETH_ADDRESS_RE.test(v.address)) return;

    try {
      const query = `{ vault: vaultByAddress(address: "${v.address}", chainId: ${Number(v.chainId)}) { address state { apy netApy totalAssetsUsd } } }`;
      const res = await fetch(MORPHO_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return;
      const json = await res.json();
      const vault = json.data?.vault;
      if (vault?.state) {
        result.set(vault.address.toLowerCase(), vault.state);
      }
    } catch {
      // Skip this vault — not found or API error
    }
  });

  await Promise.allSettled(fetches);
  return result;
}

/**
 * Correct Morpho vault APYs using real data from Morpho's API.
 * Removes phantom vaults not found in Morpho. Shared by vaults + agent routes.
 */
export async function correctMorphoVaults(vaults: Vault[]): Promise<Vault[]> {
  const morphoVaults = vaults.filter(v => v.protocol?.name?.startsWith('morpho'));
  if (morphoVaults.length === 0) return vaults;

  const morphoApys = await fetchMorphoApys(
    morphoVaults.map(v => ({ address: v.address, chainId: v.chainId }))
  );

  return vaults.filter(vault => {
    if (!vault.protocol?.name?.startsWith('morpho')) return true;

    const realData = morphoApys.get(vault.address.toLowerCase());
    if (!realData) return false;

    // Morpho API returns APY already in percentage form (12.43 = 12.43%)
    vault.analytics.apy.base = realData.netApy;
    vault.analytics.apy.total = realData.netApy;
    vault.analytics.apy.reward = realData.apy !== realData.netApy ? realData.apy - realData.netApy : 0;

    if (realData.totalAssetsUsd > 0) {
      vault.analytics.tvl.usd = String(realData.totalAssetsUsd);
    }
    return true;
  });
}
