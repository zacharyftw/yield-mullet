import { NextRequest, NextResponse } from 'next/server';
import { runAgent } from '@/lib/agentRunner';
import { fetchVaults } from '@/lib/lifi';
import { fetchMorphoApys } from '@/lib/morpho';
import { AgentType } from '@/types';

const VALID_AGENTS: AgentType[] = ['stable', 'conservative', 'degen'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    if (!VALID_AGENTS.includes(type as AgentType)) {
      return NextResponse.json({ error: 'Invalid agent type' }, { status: 400 });
    }

    // Fetch vaults from Earn API
    const vaultData = await fetchVaults({ sortBy: 'apy' });
    const vaults = vaultData.data || vaultData;

    // Fix Morpho APYs with real data
    const morphoVaults = (Array.isArray(vaults) ? vaults : []).filter(
      (v: any) => v.protocol?.name?.startsWith('morpho')
    );

    let correctedVaults = Array.isArray(vaults) ? vaults : [];

    if (morphoVaults.length > 0) {
      const morphoApys = await fetchMorphoApys(
        morphoVaults.map((v: any) => ({ address: v.address, chainId: v.chainId }))
      );

      correctedVaults = correctedVaults.filter((vault: any) => {
        const isMorpho = vault.protocol?.name?.startsWith('morpho');
        if (!isMorpho) return true;

        const realData = morphoApys.get(vault.address.toLowerCase());
        if (!realData) return false; // remove phantom Morpho vaults

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
    }

    // Run the agent with corrected data
    const decision = await runAgent(type as AgentType, correctedVaults);

    return NextResponse.json(decision);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
