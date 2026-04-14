import { NextResponse } from 'next/server';
import { runAgent } from '@/lib/agentRunner';
import { fetchVaults } from '@/lib/lifi';
import { correctMorphoVaults } from '@/lib/morpho';
import type { AgentType, AgentDecision } from '@/types';

const AGENT_TYPES: AgentType[] = ['stable', 'conservative', 'degen'];

// Cache result for 6 hours, allow stale-while-revalidate for another 6
export const revalidate = 21600;

export async function GET() {
  try {
    const vaultData = await fetchVaults({ sortBy: 'apy' });
    const corrected = await correctMorphoVaults(vaultData.data ?? []);

    const results: Record<string, AgentDecision> = {};

    // Run all 3 agents in parallel
    const decisions = await Promise.allSettled(
      AGENT_TYPES.map(type => runAgent(type, corrected))
    );

    for (let i = 0; i < AGENT_TYPES.length; i++) {
      const result = decisions[i];
      if (result.status === 'fulfilled') {
        results[AGENT_TYPES[i]] = result.value;
      }
    }

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=21600',
      },
    });
  } catch (error: unknown) {
    console.error('[api/strategies]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
