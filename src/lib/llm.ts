import OpenAI from 'openai';

interface LLMProvider {
  name: string;
  client: OpenAI | null;
  model: string;
  baseURL: string;
}

interface LLMStats {
  provider: string;
  calls: number;
  failures: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  lastUsed: string | null;
  lastError: string | null;
}

// Provider priority: SambaNova → Cerebras → Groq
const providers: LLMProvider[] = [
  {
    name: 'sambanova',
    client: process.env.SAMBANOVA_API_KEY
      ? new OpenAI({ apiKey: process.env.SAMBANOVA_API_KEY, baseURL: 'https://api.sambanova.ai/v1' })
      : null,
    model: 'Meta-Llama-3.3-70B-Instruct',
    baseURL: 'https://api.sambanova.ai/v1',
  },
  {
    name: 'cerebras',
    client: process.env.CEREBRAS_API_KEY
      ? new OpenAI({ apiKey: process.env.CEREBRAS_API_KEY, baseURL: 'https://api.cerebras.ai/v1' })
      : null,
    model: 'llama-3.3-70b',
    baseURL: 'https://api.cerebras.ai/v1',
  },
  {
    name: 'groq',
    client: process.env.GROQ_API_KEY
      ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
      : null,
    model: 'llama-3.3-70b-versatile',
    baseURL: 'https://api.groq.com/openai/v1',
  },
];

// Stats tracking per provider
const stats = new Map<string, LLMStats>(
  providers.map(p => [p.name, {
    provider: p.name,
    calls: 0,
    failures: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    lastUsed: null,
    lastError: null,
  }])
);

export interface LLMResponse {
  content: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
}

export async function callLLM(params: {
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  maxTokens?: number;
  temperature?: number;
}): Promise<LLMResponse> {
  const available = providers.filter(p => p.client !== null);
  if (available.length === 0) throw new Error('No LLM providers configured');

  const errors: string[] = [];

  for (const provider of available) {
    const providerStats = stats.get(provider.name)!;

    try {
      const completion = await provider.client!.chat.completions.create({
        model: provider.model,
        max_tokens: params.maxTokens ?? 1024,
        temperature: params.temperature ?? 0.3,
        messages: params.messages,
      });

      const content = completion.choices[0]?.message?.content || '';
      const inputTokens = completion.usage?.prompt_tokens ?? 0;
      const outputTokens = completion.usage?.completion_tokens ?? 0;

      // Update stats
      providerStats.calls++;
      providerStats.totalInputTokens += inputTokens;
      providerStats.totalOutputTokens += outputTokens;
      providerStats.lastUsed = new Date().toISOString();

      console.log(`[llm] ${provider.name} OK | in:${inputTokens} out:${outputTokens} | total calls:${providerStats.calls}`);

      return { content, provider: provider.name, inputTokens, outputTokens };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      providerStats.failures++;
      providerStats.lastError = msg;

      console.error(`[llm] ${provider.name} FAILED: ${msg.slice(0, 120)}`);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  throw new Error(`All LLM providers failed:\n${errors.join('\n')}`);
}

export function getLLMStats(): LLMStats[] {
  return Array.from(stats.values());
}
