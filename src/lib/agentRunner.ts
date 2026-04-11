import { callLLM } from './llm';
import { AGENT_CONFIGS } from './agents';
import type { AgentDecision, AgentType, Vault, VaultAllocation } from '@/types';

function sanitize(s: string, maxLen = 60): string {
  return s.replace(/[^\x20-\x7E]/g, '').slice(0, maxLen);
}

// Pre-filter vaults by agent risk profile — reduces 500+ vaults to ~20-30
function preFilter(vaults: Vault[], agentType: AgentType): Vault[] {
  const tx = vaults.filter(v => v.isTransactional);

  switch (agentType) {
    case 'stable': {
      const filtered = tx.filter(v => {
        const tvl = parseFloat(v.analytics.tvl.usd);
        const hasStable = v.tags.includes('stablecoin');
        return hasStable && tvl >= 1_000_000;
      });
      return filtered.sort((a, b) => (b.analytics.apy.total ?? 0) - (a.analytics.apy.total ?? 0)).slice(0, 30);
    }
    case 'conservative': {
      const filtered = tx.filter(v => {
        const tvl = parseFloat(v.analytics.tvl.usd);
        const apy = v.analytics.apy.total ?? 0;
        return tvl >= 500_000 && apy < 50 && apy > 0;
      });
      return filtered.sort((a, b) => (b.analytics.apy.total ?? 0) - (a.analytics.apy.total ?? 0)).slice(0, 30);
    }
    case 'degen': {
      const filtered = tx.filter(v => {
        const tvl = parseFloat(v.analytics.tvl.usd);
        const apy = v.analytics.apy.total ?? 0;
        return tvl >= 100_000 && apy > 0;
      });
      return filtered.sort((a, b) => (b.analytics.apy.total ?? 0) - (a.analytics.apy.total ?? 0)).slice(0, 30);
    }
  }
}

function toTsv(vaults: Vault[]): string {
  const header = 'address\tprotocol\tchain\tasset\tapy\tapy7d\ttvl\ttags';
  const rows = vaults.map(v => [
    v.address,
    sanitize(v.protocol.name, 20),
    sanitize(v.network, 15),
    v.underlyingTokens.map(t => t.symbol).join('/'),
    (v.analytics.apy.total ?? 0).toFixed(2),
    (v.analytics.apy7d ?? 0).toFixed(2),
    v.analytics.tvl.usd,
    v.tags.join(','),
  ].join('\t'));
  return [header, ...rows].join('\n');
}

export async function runAgent(
  agentType: AgentType,
  vaults: Vault[]
): Promise<AgentDecision> {
  const config = AGENT_CONFIGS[agentType];
  if (!config) throw new Error(`Unknown agent type: ${agentType}`);

  const candidates = preFilter(vaults, agentType);
  if (candidates.length === 0) throw new Error('No vaults match agent criteria');

  const tsv = toTsv(candidates);

  const result = await callLLM({
    messages: [
      { role: 'system', content: config.systemPrompt },
      {
        role: 'user',
        content: `Analyze these ${candidates.length} pre-filtered vaults (TSV format) and provide your allocation.\n\n<vault-data>\n${tsv}\n</vault-data>\n\nRespond with ONLY the JSON allocation.`
      }
    ],
    maxTokens: 1024,
    temperature: 0.3,
  });

  const jsonMatch = result.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Agent did not return valid JSON');

  let decision;
  try {
    decision = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('Agent returned malformed JSON');
  }

  if (!decision.allocations || !Array.isArray(decision.allocations)) {
    throw new Error('Agent response missing allocations array');
  }

  const selectedVaults: VaultAllocation[] = [];
  for (const a of decision.allocations as Array<{ vaultAddress: string; percent: number; reason: string }>) {
    const vault = candidates.find(v => v.address === a.vaultAddress);
    if (vault) {
      selectedVaults.push({
        vault,
        allocationPercent: a.percent,
        reason: a.reason,
      });
    }
  }

  return {
    agent: agentType,
    timestamp: new Date().toISOString(),
    selectedVaults,
    reasoning: decision.reasoning || '',
    riskScore: decision.riskScore ?? 5,
  };
}
