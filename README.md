# AgentGate

Privacy-preserving AI governance layer and accountability middleware for autonomous agents.  
**Stack:** Next.js 15 · React 19 · TypeScript · Prisma · Postgres · viem · Avalanche Fuji

---

## Quickstart

### 1. Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `AGENTGATE_JWT_SECRET` | ✅ | 32+ char random string for JWT signing |
| `RPC_URL` | For anchor | Avalanche Fuji RPC (public: `https://api.avax-test.network/ext/bc/C/rpc`) |
| `DEPLOYER_PRIVATE_KEY` | For anchor | Funded Fuji test wallet private key |
| `AUDIT_LOGGER_ADDRESS` | After deploy | Set after `npm run contracts:deploy:fuji` |

### 2. Database

```bash
npm install
npx prisma db push          # applies schema to your Postgres
```

### 3. Run

```bash
npm run dev                  # Next.js on http://localhost:3000
```

---

## Smart Contract (Avalanche Fuji)

### Install + compile

```bash
npm run contracts:install
npm run contracts:compile
```

### Test locally

```bash
cd contracts && npm test
```

### Deploy to Fuji

Get testnet AVAX: [https://faucet.avax.network](https://faucet.avax.network) → select Fuji (C-Chain), ~0.5 AVAX is enough.

```bash
DEPLOYER_PRIVATE_KEY=0x... RPC_URL=https://api.avax-test.network/ext/bc/C/rpc \
  npm run contracts:deploy:fuji
```

Copy the printed address into `.env.local` as `AUDIT_LOGGER_ADDRESS`.

---

## API Reference

Base path: `/api/v1`

### `POST /decisions/propose`

Create a governed decision. Risk engine auto-scores and auto-approves low-risk actions.

**Query:** `?canned=high|low` — skip body, use a hardcoded demo payload (FR-12 reliability fallback).

**Body:**
```json
{
  "agent_id": "agent-demo-01",
  "org_id": "demo-dao",
  "action": { "type": "treasury.swap", "params": { "from": "ETH", "to": "USDC", "pct": 5, "estimated_usd": 150000 } },
  "rationale_summary": "Reducing ETH concentration risk.",
  "reasoning_ref": { "run_id": "optional-langsmith-id" }
}
```

**Response:** Full `Decision` object. `status` is `pending_approval` (high/medium) or `auto_approved` (low) + `execution_grant`.

---

### `GET /decisions/:id`

Full decision detail including `execution_grant` once approved.

---

### `POST /decisions/:id/approve`

Reviewer approves a `pending_approval` decision. Anchors hash on Avalanche Fuji, issues JWT execution grant.

```json
{ "approver": "0xReviewerAddress" }
```

---

### `POST /decisions/:id/reject`

Reviewer rejects with a required reason (1–500 chars). Reason hash anchored on-chain.

```json
{ "reason": "Market dip expected in 24h", "rejector": "treasury-lead" }
```

---

### `GET /orgs/:orgId/decisions`

Timeline list with stats.

**Query:** `?status=pending_approval|approved|rejected|auto_approved` · `?agent_id=...` · `?limit=50`

**Response:**
```json
{
  "decisions": [...],
  "stats": { "total": 45, "pending_approval": 3, "approved": 28, "rejected": 4, "auto_approved": 10 }
}
```

---

### `POST /demo/reset`

Clears all `demo-dao` decisions. Resets to zero in < 5s. Safe for demo booth loops.

---

## Risk Engine Rules

| Rule | Condition | Effect |
|---|---|---|
| R1 | `estimated_usd > $100k` | HIGH → `pending_approval` |
| R2 | `action.type` in `treasury.swap`, `treasury.transfer`, `governance.vote`, `contract.deploy`, `contract.upgrade` | +MEDIUM risk |
| R3 | `action.type` in whitelisted set AND `estimated_usd ≤ $10k` | LOW → `auto_approved` |

Whitelisted low-risk types: `treasury.claim`, `treasury.stake`, `treasury.harvest`, `portfolio.rebalance_small`.

---

## Demo Script (60–90s)

```bash
# 1. HIGH risk path
curl -X POST 'http://localhost:3000/api/v1/decisions/propose?canned=high'
# → status: pending_approval, risk: high

# 2. Reviewer approves (or do it via dashboard)
curl -X POST 'http://localhost:3000/api/v1/decisions/<id>/approve' \
  -H 'content-type: application/json' -d '{"approver":"treasury-lead"}'
# → status: approved, anchor_tx: 0x..., execution_grant.token: eyJ...

# 3. LOW risk path (auto-approves instantly)
curl -X POST 'http://localhost:3000/api/v1/decisions/propose?canned=low'
# → status: auto_approved, execution_grant.token: eyJ...

# 4. View timeline
curl 'http://localhost:3000/api/v1/orgs/demo-dao/decisions'

# 5. Reset for next run
curl -X POST 'http://localhost:3000/api/v1/demo/reset'
```

---

## Project Structure

```
agentgate-app/
├── src/
│   ├── app/
│   │   ├── api/v1/          # Route Handlers (backend)
│   │   │   ├── decisions/
│   │   │   │   ├── propose/route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      (GET)
│   │   │   │       ├── approve/route.ts
│   │   │   │       └── reject/route.ts
│   │   │   ├── orgs/[orgId]/decisions/route.ts
│   │   │   └── demo/reset/route.ts
│   │   ├── layout.tsx       # Frontend team owns below here
│   │   └── page.tsx
│   ├── lib/
│   │   ├── db.ts            # Prisma client singleton
│   │   ├── types.ts         # Shared TS types (Decision, etc.)
│   │   ├── risk-engine.ts   # R1/R2/R3 scoring rules
│   │   ├── hash.ts          # keccak256 canonical hash
│   │   ├── anchor.ts        # viem → Avalanche Fuji AuditLogger
│   │   ├── execution-grant.ts  # HS256 JWT issuance
│   │   └── canned-payloads.ts  # Demo fallback payloads
│   └── constants/index.ts
├── prisma/
│   └── schema.prisma        # Decision model
├── contracts/
│   ├── contracts/AuditLogger.sol
│   ├── scripts/deploy.ts
│   ├── test/AuditLogger.test.ts
│   └── hardhat.config.ts
└── docker-compose.yml       # Local Postgres on :5433 (optional if using remote DB)
```
