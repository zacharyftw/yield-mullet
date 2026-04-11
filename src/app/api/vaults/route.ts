import { NextRequest, NextResponse } from 'next/server';
import { fetchVaults } from '@/lib/lifi';
import { fetchMorphoApys } from '@/lib/morpho';
import type { Vault } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await fetchVaults({
      chainId: searchParams.get('chainId') ? Number(searchParams.get('chainId')) : undefined,
      asset: searchParams.get('asset') || undefined,
      minTvl: searchParams.get('minTvl') ? Number(searchParams.get('minTvl')) : undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      cursor: searchParams.get('cursor') || undefined,
    });

    const vaults: Vault[] = data.data ?? [];

    // Identify Morpho vaults and fetch real APYs
    const morphoVaults = vaults.filter(
      (v) => v.protocol?.name?.startsWith('morpho')
    );

    if (morphoVaults.length > 0) {
      const morphoApys = await fetchMorphoApys(
        morphoVaults.map((v) => ({ address: v.address, chainId: v.chainId }))
      );

      // Override Li.Fi APYs with real Morpho data, remove unverified Morpho vaults
      const verifiedVaults = vaults.filter((vault) => {
        const isMorpho = vault.protocol?.name?.startsWith('morpho');
        if (!isMorpho) return true;

        const realData = morphoApys.get(vault.address.toLowerCase());
        if (!realData) return false;

        // Morpho API returns APY already in percentage form (12.43 = 12.43%)
        const apyPct = realData.apy;
        const netApyPct = realData.netApy;

        vault.analytics.apy.base = netApyPct;
        vault.analytics.apy.total = netApyPct;
        vault.analytics.apy.reward = apyPct !== netApyPct ? apyPct - netApyPct : 0;

        if (realData.totalAssetsUsd > 0) {
          vault.analytics.tvl.usd = String(realData.totalAssetsUsd);
        }
        return true;
      });

      return NextResponse.json({ data: verifiedVaults, meta: data.meta });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
