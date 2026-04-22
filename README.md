# SwarmFi

SwarmFi is a DeFi yield aggregator that uses three AI agents with different risk appetites to decide where your money should go across 21 chains and 672+ vaults. You pick a strategy, the agent analyzes live vault data, explains its reasoning, and you deposit in one click via LI.FI's cross-chain infrastructure.

**Live:** [swarmfi.vercel.app](https://swarmfi.vercel.app)

Built during the [DeFi Mullet Hackathon #1](https://github.com/brucexu-eth/defi-mullet-hackathon) (April 8–14, 2026).

## How it works

1. Connect your wallet
2. Pick one of three agents:
   - **Stable** — stablecoins only, blue-chip protocols, sleep-at-night money
   - **Conservative** — 50/50 split between stable and higher-yield vaults
   - **Degen** — hunts the highest APYs across all chains, tolerates newer protocols
3. The agent pulls live vault data from LI.FI Earn, scores each vault on APY vs gas cost vs protocol risk, and picks an allocation
4. You see exactly *why* it made each choice in the Proof of Strategy log
5. Deposit into any vault with a single transaction — LI.FI Composer handles the swap, bridge, and deposit behind the scenes

## The agent logic

Each agent is a system prompt fed to Llama 3.3 70B with real vault data as context. Inference fails over through SambaNova → Cerebras → Groq so a single provider outage doesn't kill the app. They return structured JSON with vault picks, allocation percentages, and reasoning. The agents don't move money — they recommend, you approve.

The scoring considers:
- Raw APY vs 7-day average APY (is it sustainable?)
- TVL as a proxy for trust (Stable agent won't touch anything under $5M)
- Gas and bridging costs (don't move for marginal gains)
- Protocol maturity and audit status

## Running locally

```bash
git clone https://github.com/zacharyftw/swarmfi.git
cd swarmfi
pnpm install
cp .env.example .env.local
# fill in your keys (see below)
pnpm dev
```

Keys in `.env.local`:

| Variable | Required | Where to get it |
|----------|----------|----------------|
| `LIFI_API_KEY` | yes | [portal.li.fi](https://portal.li.fi) |
| `NEXT_PUBLIC_WC_PROJECT_ID` | yes | [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `SAMBANOVA_API_KEY` | at least one LLM provider | [cloud.sambanova.ai](https://cloud.sambanova.ai) |
| `CEREBRAS_API_KEY` | at least one LLM provider | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| `GROQ_API_KEY` | at least one LLM provider | [console.groq.com](https://console.groq.com) |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | optional | [alchemy.com](https://alchemy.com) — falls back to public RPCs if unset |

Agent calls fail over in the order **SambaNova → Cerebras → Groq**, so configure whichever you have access to (SambaNova and Cerebras run the fastest Llama 3.3 70B inference; Groq is the fallback).

## Stack

- Next.js 16 (App Router) — frontend and API routes, no separate backend
- Tailwind CSS + Framer Motion — UI
- wagmi + viem + RainbowKit — wallet connection and tx signing
- SambaNova / Cerebras / Groq (Llama 3.3 70B, with automatic failover) — agent reasoning
- LI.FI Earn API — vault discovery, APY/TVL data
- LI.FI Composer API — cross-chain deposit transactions

## API integration

Two separate LI.FI services:

- **Earn Data API** (`earn.li.fi`) — vault list, portfolio positions, chain/protocol metadata. Requires `LIFI_API_KEY` via `x-lifi-api-key` header.
- **Composer** (`li.quest`) — builds the actual transaction for deposits. Requires API key. The quote endpoint is `GET` not `POST`, and `toToken` must be the vault address, not the underlying token.

## Project structure

```
src/
├── app/
│   ├── page.tsx                    # main dashboard
│   ├── vaults/page.tsx             # full vault explorer
│   ├── providers(-inner).tsx       # wagmi + RainbowKit + theme
│   └── api/
│       ├── vaults/                 # proxy to Earn API
│       ├── agents/[type]/          # runs agent reasoning on demand
│       ├── strategies/             # cached daily strategies (cron-refreshed)
│       ├── quote/                  # proxy to Composer
│       ├── portfolio/[address]/    # user positions
│       └── llm-stats/              # per-provider call + token stats
├── lib/
│   ├── lifi.ts                     # Earn + Composer client
│   ├── lifi-contracts.ts           # vault contract helpers
│   ├── llm.ts                      # multi-provider LLM client w/ failover
│   ├── agents.ts                   # 3 agent system prompts
│   ├── agentRunner.ts              # LLM call + JSON parsing
│   ├── morpho.ts                   # Morpho-specific vault logic
│   ├── chains.ts, chainColors.ts   # chain metadata
│   ├── tokens.ts, protocols.ts     # token + protocol metadata
│   └── validation.ts               # schema guards
├── hooks/
│   ├── useVaults.ts                # fetch + filter vaults
│   ├── useStrategies.ts            # cached agent strategies
│   ├── useAgent.ts                 # trigger agent reasoning
│   ├── useDeposit.ts               # quote + execute deposit
│   ├── usePortfolio.ts             # user positions
│   ├── useTokenBalance.ts          # ERC-20 balance reads
│   ├── useCountUp.ts               # animated number helper
│   └── useTheme.ts                 # dark/light toggle
├── components/
│   ├── ui/                         # AgentCard, VaultCard, Navbar, Skeleton
│   ├── dashboard/                  # ProofOfStrategy, PortfolioBreakdown, VaultTable, AgentResults
│   └── deposit/                    # DepositModal
```

A daily Vercel cron (`vercel.json`) hits `/api/strategies` to refresh the three cached agent strategies so the dashboard loads instantly.

## Track

Yield Builder