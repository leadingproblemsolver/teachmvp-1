# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **LLM**: Anthropic claude-sonnet-4-6 via Replit AI Integrations

## Artifacts

### Objective Crystallizer (`artifacts/crystallizer`)
- **Frontend**: React + Vite at `/`
- **Purpose**: Converts teacher session intent into a three-field constraint-form objective
- **Fields**: maximize / must_not_break / success_criterion

### API Server (`artifacts/api-server`)
- **Backend**: Express 5, TypeScript
- **Routes**:
  - `POST /api/crystallize` — LLM-powered intent → objective conversion
  - `POST /api/log-edit` — Fire-and-forget field edit tracking
  - `GET /api/healthz` — Health check

## Key Architecture Decisions

### Behavioral Specificity Classifier
- Location: `artifacts/api-server/src/services/crystallize.ts`
- **Blocklist-first**: Cognitive state verbs ("understands", "grasps", "knows", etc.) are immediately rejected
- **Allowlist check**: Observable action verbs + numeric threshold patterns must both be present
- Returns `{status: "clarify"}` with a single focused question if criterion fails
- Never repairs the criterion automatically — returns to the teacher for one specific input

### T0 Sync-Integrity Rules
- Prompt text is in `src/services/crystallize.ts`
- Business logic constraints (blocklist/allowlist) are in `src/services/crystallize.ts`
- Three-field output contract enforced at schema + application layer
- No regeneration in WEDGE phase

### Logging / Edit Tracking
- Edit events are structured JSON logged to stdout
- Anonymous `session_id` (client-generated UUID stored in `sessionStorage`)
- Fire-and-forget from client — never blocks response
- No PII, no teacher identity

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
