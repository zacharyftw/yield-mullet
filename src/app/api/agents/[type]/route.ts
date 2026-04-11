import { NextRequest, NextResponse } from 'next/server';
import { runAgent } from '@/lib/agentRunner';
import { fetchVaults } from '@/lib/lifi';
import { correctMorphoVaults } from '@/lib/morpho';
import type { AgentType } from '@/types';

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

    const vaultData = await fetchVaults({ sortBy: 'apy' });
    const corrected = await correctMorphoVaults(vaultData.data ?? []);
    const decision = await runAgent(type as AgentType, corrected);

    return NextResponse.json(decision);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
