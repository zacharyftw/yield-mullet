# Yield Mullet

Business in the front, yield in the back.

Yield Mullet is a DeFi yield aggregator that uses three AI agents with different risk appetites to decide where your money should go across 21 chains and 672+ vaults. You pick a strategy, the agent analyzes live vault data, explains its reasoning, and you deposit in one click via LI.FI's cross-chain infrastructure.

**Live:** [yield-mullet.vercel.app](https://yield-mullet.vercel.app)

Built during the [DeFi Mullet Hackathon #1](https://github.com/brucexu-eth/defi-mullet-hackathon) (April 8-14, 2026).

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

Each agent is a system prompt fed to Llama 3.3 70B (via Groq) with real vault data as context. They return structured JSON with vault picks, allocation percentages, and reasoning. The agents don't move money — they recommend, you approve.

The scoring considers:
- Raw APY vs 7-day average APY (is it sustainable?)
- TVL as a proxy for trust (Stable agent won't touch anything under $5M)
- Gas and bridging costs (don't move for marginal gains)
- Protocol maturity and audit status

## Running locally

```bash
git clone https://github.com/zacharyftw/yield-mullet.git
cd yield-mullet
pnpm install
cp .env.example .env.local
# fill in your keys (see below)
pnpm dev
```

You need three keys in `.env.local`:

| Variable | Where to get it |
|----------|----------------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) — free tier |
| `LIFI_API_KEY` | [portal.li.fi](https://portal.li.fi) |
| `NEXT_PUBLIC_WC_PROJECT_ID` | [cloud.walletconnect.com](https://cloud.walletconnect.com) |

## Stack

- Next.js 16 (App Router) — frontend and API routes, no separate backend
- Tailwind CSS + Framer Motion — UI
- wagmi + viem + RainbowKit — wallet connection and tx signing
- Groq (Llama 3.3 70B) — agent reasoning
- LI.FI Earn API — vault discovery, APY/TVL data
- LI.FI Composer API — cross-chain deposit transactions

## API integration

Two separate LI.FI services:

- **Earn Data API** (`earn.li.fi`) — vault list, portfolio positions, chain/protocol metadata. No auth needed.
- **Composer** (`li.quest`) — builds the actual transaction for deposits. Requires API key. The quote endpoint is `GET` not `POST`, and `toToken` must be the vault address, not the underlying token.

## Project structure

```
src/
├── app/
│   ├── page.tsx                    # main dashboard
│   └── api/
│       ├── vaults/                 # proxy to Earn API
│       ├── agents/[type]/          # runs agent reasoning
│       ├── quote/                  # proxy to Composer
│       └── portfolio/[address]/    # user positions
├── lib/
│   ├── lifi.ts                     # Earn + Composer client
│   ├── agents.ts                   # 3 agent system prompts
│   └── agentRunner.ts              # Groq call + JSON parsing
├── hooks/
│   ├── useVaults.ts                # fetch + filter vaults
│   ├── useAgent.ts                 # trigger agent reasoning
│   ├── useDeposit.ts               # quote + execute deposit
│   └── usePortfolio.ts             # user positions
└── components/
    ├── ui/                         # AgentCard, VaultCard, Navbar
    ├── dashboard/                  # ProofOfStrategy, PortfolioBreakdown
    └── deposit/                    # DepositModal
```

## Track

Yield Builder