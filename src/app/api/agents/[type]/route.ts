import { NextRequest, NextResponse } from 'next/server';
import { runAgent } from '@/lib/agentRunner';
import { fetchVaults } from '@/lib/lifi';
import { fetchMorphoApys } from '@/lib/morpho';
import type { AgentType, Vault } from '@/types';

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
    const vaults: Vault[] = vaultData.data ?? [];

    // Fix Morpho APYs with real data
    const morphoVaults = vaults.filter(
      (v) => v.protocol?.name?.startsWith('morpho')
    );

    let correctedVaults = vaults;

    if (morphoVaults.length > 0) {
      const morphoApys = await fetchMorphoApys(
        morphoVaults.map((v) => ({ address: v.address, chainId: v.chainId }))
      );

      correctedVaults = vaults.filter((vault) => {
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
    }

    // Run the agent with corrected data
    const decision = await runAgent(type as AgentType, correctedVaults);

    return NextResponse.json(decision);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
