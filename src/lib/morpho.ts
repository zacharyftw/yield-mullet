const MORPHO_API_URL = 'https://api.morpho.org/graphql';

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
    try {
      const query = `{ vault: vaultByAddress(address: "${v.address}", chainId: ${v.chainId}) { address state { apy netApy totalAssetsUsd } } }`;
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
