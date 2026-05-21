# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# App
npm run dev              # Next.js dev server (default port 3000)
npm run build            # Production build
npm run lint             # ESLint via next lint

# Database (Prisma + remote Postgres via DATABASE_URL in .env.local)
npx prisma db push       # Apply schema changes without a migration file
npx prisma generate      # Regenerate Prisma client after schema edits
npx prisma studio        # Browse/edit data in browser

# Smart contract (run from repo root, proxied into contracts/)
npm run contracts:compile          # hardhat compile
npm run contracts:test             # hardhat test (local hardhat network)
npm run contracts:deploy:fuji      # deploy AuditLogger to Avalanche Fuji
# Or run directly inside contracts/ with: npx hardhat <cmd>
```

**Prisma CLI note:** `npx prisma` reads `.env` (not `.env.local`). The repo keeps a `.env` file at root with `DATABASE_URL` mirroring `.env.local` for CLI use. If they drift, re-sync manually.

**Port conflicts:** port 3000 may be taken locally — run `next dev --port 3333` (or any free port) instead.

## Architecture

### What AgentGate does
Governance middleware: an AI agent calls `POST /api/v1/decisions/propose` *before* executing a sensitive action. The risk engine scores it. LOW risk → auto-approved immediately. HIGH/MEDIUM → held as `pending_approval` until a human reviewer approves or rejects via the dashboard. On approval, a hash of the decision is anchored on Avalanche Fuji and a signed JWT execution grant is returned to the agent.

### Request flow
```
Agent → POST /propose → risk-engine → [auto_approved] or [pending_approval]
                                            ↓ (human review)
                                     POST /approve or /reject
                                            ↓
                                     anchor.ts → AuditLogger.sol (Avalanche Fuji)
                                            ↓
                                     execution_grant (JWT, 1h TTL)
```

### Backend: Next.js Route Handlers (`src/app/api/v1/`)
All backend logic lives in route handler files — there is no separate server process. The pattern is: validate with Zod → call `src/lib/*` → return `NextResponse.json(toApiDecision(row))`.

Key lib modules:
- **`src/lib/risk-engine.ts`** — pure function `scoreRisk(action)`. Hardcoded rules R1/R2/R3: notional > $100k → HIGH; elevated action types → +MEDIUM; whitelisted types + notional ≤ $10k → LOW (auto-approve). Thresholds and type sets are constants at the top of the file.
- **`src/lib/anchor.ts`** — viem `walletClient.writeContract` → `AuditLogger.recordDecision`. Gracefully returns `null` if `RPC_URL`, `DEPLOYER_PRIVATE_KEY`, or `AUDIT_LOGGER_ADDRESS` are absent — the demo works without a funded wallet.
- **`src/lib/hash.ts`** — `computeProposalHash` canonicalises the decision payload and keccak256s it; `computeReasonHash` does the same for rejection reasons. `toBytes32` pads a hex string to 32 bytes for Solidity.
- **`src/lib/execution-grant.ts`** — issues an HS256 JWT (via `jose`) signed with `AGENTGATE_JWT_SECRET`.
- **`src/lib/db.ts`** — Prisma client singleton with the standard Next.js dev hot-reload guard.
- **`src/lib/api-helpers.ts`** — `toApiDecision(prismaRow)` maps camelCase DB fields → snake_case API shape; `err(msg, status)` returns a `NextResponse` error.
- **`src/lib/types.ts`** — canonical TypeScript types for `Decision`, `ProposeInput`, etc. Import from here for both FE and BE code.
- **`src/lib/canned-payloads.ts`** — demo fallback payloads. `?canned=high` or `?canned=low` on the propose endpoint bypasses body parsing and uses these.

### Data model
Single `decisions` table (see `prisma/schema.prisma`). JSON columns (`action`, `approvals`, `rejection`, `executionGrant`, `reasoningRef`) store nested objects directly — no separate tables. Prisma enums: `RiskLevel` (low/medium/high), `DecisionStatus` (pending_approval/approved/rejected/auto_approved). The API layer converts DB camelCase → response snake_case in `toApiDecision`.

### Smart contract (`contracts/`)
`AuditLogger.sol` is event-only — no storage writes. One function: `recordDecision(bytes32 proposalHash, bytes32 status, address approver, bytes32 decisionId)` emits `DecisionRecorded`. Gas cost is minimal. The contracts workspace is a standalone npm package under `contracts/` with its own `package.json`, `tsconfig.json`, and `hardhat.config.ts`. It does **not** share node_modules with the root app.

### Frontend (to be built)
Pages go in `src/app/` (Next.js App Router). Shared types are in `src/lib/types.ts`. The API base URL is exported from `src/constants/index.ts` as `API_BASE_URL` (defaults to `/api/v1`). The Avalanche Fuji explorer base is `BASE_EXPLORER`. Empty barrel files exist in `src/components/`, `src/hooks/`, `src/contexts/`, `src/store/`, `src/utils/` — fill them as the UI grows.

## Environment variables

| Variable | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | Prisma (runtime + CLI) | Remote Postgres; in `.env.local` (Next) and `.env` (Prisma CLI) |
| `AGENTGATE_JWT_SECRET` | `execution-grant.ts` | Signs execution grant JWTs |
| `RPC_URL` | `anchor.ts`, `hardhat.config.ts` | Avalanche Fuji RPC endpoint |
| `DEPLOYER_PRIVATE_KEY` | `anchor.ts`, `hardhat.config.ts` | Funded Avalanche Fuji wallet |
| `AUDIT_LOGGER_ADDRESS` | `anchor.ts` | Set after `npm run contracts:deploy:fuji` |
| `NEXT_PUBLIC_BASE_EXPLORER` | Frontend | Block explorer base URL |

If `RPC_URL`, `DEPLOYER_PRIVATE_KEY`, or `AUDIT_LOGGER_ADDRESS` are missing/placeholder, `anchor.ts` skips the on-chain write and returns `null` — the API continues normally with `anchor_tx: null`.

## Demo paths

```bash
# HIGH risk (pending_approval → human approve)
curl -X POST 'http://localhost:3000/api/v1/decisions/propose?canned=high'
curl -X POST 'http://localhost:3000/api/v1/decisions/<id>/approve' \
  -H 'content-type: application/json' -d '{"approver":"treasury-lead"}'

# LOW risk (auto_approved instantly)
curl -X POST 'http://localhost:3000/api/v1/decisions/propose?canned=low'

# Reset demo-dao state
curl -X POST 'http://localhost:3000/api/v1/demo/reset'
```
