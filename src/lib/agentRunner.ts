import OpenAI from 'openai';
import { AGENT_CONFIGS } from './agents';
import type { AgentDecision, AgentType, Vault, VaultAllocation } from '@/types';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function runAgent(
  agentType: AgentType,
  vaults: Vault[]
): Promise<AgentDecision> {
  const config = AGENT_CONFIGS[agentType];
  if (!config) throw new Error(`Unknown agent type: ${agentType}`);

  // Filter to only transactional vaults
  const transactionalVaults = vaults.filter(v => v.isTransactional);

  // Prepare vault data summary for the LLM
  const vaultSummary = transactionalVaults.map(v => ({
    address: v.address,
    name: v.name,
    protocol: v.protocol.name,
    chain: v.network,
    chainId: v.chainId,
    asset: v.underlyingTokens.map(t => t.symbol).join('/'),
    apyBase: v.analytics.apy.base,
    apyReward: v.analytics.apy.reward,
    apyTotal: v.analytics.apy.total,
    apy7d: v.analytics.apy7d,
    tvlUsd: v.analytics.tvl.usd,
    tags: v.tags,
  }));

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2048,
    temperature: 0.3,
    messages: [
      { role: 'system', content: config.systemPrompt },
      {
        role: 'user',
        content: `Here are the available vaults. Analyze and provide your allocation decision:\n\n${JSON.stringify(vaultSummary, null, 2)}`
      }
    ],
  });

  const responseText = completion.choices[0]?.message?.content || '';

  // Parse the JSON response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
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

  // Only include vaults that actually exist in our data
  const selectedVaults: VaultAllocation[] = [];
  for (const a of decision.allocations as Array<{ vaultAddress: string; percent: number; reason: string }>) {
    const vault = transactionalVaults.find(v => v.address === a.vaultAddress);
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
