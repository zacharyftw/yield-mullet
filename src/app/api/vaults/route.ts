import { NextRequest, NextResponse } from 'next/server';
import { fetchVaults } from '@/lib/lifi';
import { fetchMorphoApys } from '@/lib/morpho';

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

    // Identify Morpho vaults and fetch real APYs
    const vaults = Array.isArray(data) ? data : data?.data ?? [];
    const morphoVaults = vaults.filter(
      (v: any) => v.protocol?.name?.startsWith('morpho')
    );

    if (morphoVaults.length > 0) {
      const morphoApys = await fetchMorphoApys(
        morphoVaults.map((v: any) => ({ address: v.address, chainId: v.chainId }))
      );

      // Override Li.Fi APYs with real Morpho data, remove unverified Morpho vaults
      const verifiedVaults = vaults.filter((vault: any) => {
        const isMorpho = vault.protocol?.name?.startsWith('morpho');
        if (!isMorpho) return true; // keep all non-Morpho vaults

        const realData = morphoApys.get(vault.address.toLowerCase());
        if (!realData) return false; // remove phantom Morpho vaults

        // Normalize: if value < 1, it's a ratio → multiply by 100
        const apyPct = realData.apy < 1 ? realData.apy * 100 : realData.apy;
        const netApyPct = realData.netApy < 1 ? realData.netApy * 100 : realData.netApy;

        vault.analytics.apy.base = netApyPct;
        vault.analytics.apy.total = netApyPct;
        vault.analytics.apy.reward = apyPct !== netApyPct ? apyPct - netApyPct : 0;

        if (realData.totalAssetsUsd > 0) {
          vault.analytics.tvl.usd = String(realData.totalAssetsUsd);
        }
        return true;
      });

      // Update the response data
      if (Array.isArray(data)) {
        return NextResponse.json(verifiedVaults);
      }
      data.data = verifiedVaults;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
