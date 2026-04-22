# AI SDK + KeelStack Guard – Production-ready duplicate prevention

[![npm version](https://img.shields.io/npm/v/@keelstack/guard)](https://www.npmjs.com/package/@keelstack/guard)
[![GitHub stars](https://img.shields.io/badge/stars-placeholder-lightgrey)](https://github.com/KeelStack-me/ai-with-guard)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

Duplicate tool calls cost money and cause errors. This fork adds idempotency, budgets, and approval gates using `@keelstack/guard`.

## Why this fork exists

AI agents often retry tool calls. Without guardrails, retries can trigger duplicate charges, duplicate writes, and unsafe irreversible actions.

This fork integrates `@keelstack/guard` into tool execution so you get:

- **Idempotency (core):** stable key-based duplicate prevention
- **Budget limits:** per-user spend controls (configurable)
- **Approval gates:** risk-based policy (`warn` or `block`) for sensitive actions

## Quick start

```bash
pnpm --filter @example/next-agent add @keelstack/guard
```

```ts
import { guard } from '@keelstack/guard';
import { createHash } from 'node:crypto';

const key = `tool:${toolName}:${userId}:${createHash('sha256').update(JSON.stringify(args)).digest('hex')}`;

const result = await guard({
  key,
  action: () => runTool(args),
  budget: { id: userId, limitUsd: 5, warnAt: [0.5, 0.8] },
  extractCost: () => 0.001,
  risk: { level: 'irreversible', policy: 'warn' },
});
```

## What changed in this fork

- Integrated guard into the main tool execution path in `examples/next-agent/tool/weather-tool.ts`
- Added stable idempotency key format: `tool:${toolName}:${userId}:${hash(args)}`
- Added optional budget controls via `GUARD_BUDGET_LIMIT_USD`
- Added approval-gate style risk policy via `GUARD_APPROVAL_POLICY` (`warn` or `block`)
- Added complete duplicate-prevention demo: `examples/with-guard.ts`
- Added idempotency test: `examples/ai-functions/src/with-guard.test.ts`

## Original vs this fork

| Capability | Original starter | This fork (`ai-with-guard`) |
|---|---|---|
| Basic AI tool calling | ✅ | ✅ |
| Idempotent tool execution | ❌ | ✅ |
| Duplicate call replay handling | ❌ | ✅ |
| Per-user budget limits | ❌ | ✅ |
| Approval/risk gates | ❌ | ✅ |
| Guard-focused example | ❌ | ✅ |

## Run the duplicate prevention demo

```bash
pnpm --filter @example/ai-functions exec tsx ../with-guard.ts
```

Expected behavior:

- First call: `status: "executed"`, `fromCache: false`
- Second identical call: `status: "replayed"`, `fromCache: true`
- Side effect runs only once

## Configuration

In `examples/next-agent`, optional environment variables:

- `GUARD_BUDGET_LIMIT_USD` – enable budget cap when set to a number > 0
- `GUARD_APPROVAL_POLICY` – `warn` (default) or `block`
- `GUARD_RISK_LEVEL` – `safe` (default), `reversible`, or `irreversible`

## SEO keywords

- ai with guardrails
- AI SDK with guard
- ai agent idempotency
- prevent duplicate tool calls
- tool call deduplication
- langgraph guard
- vercel ai sdk guardrails
- production ai guardrails
- budget limits for ai agents
- approval gates for ai tool calls

## Attribution

This is a fork of [vercel/ai](https://github.com/vercel/ai). All credit to original authors. Guard integration by Siddhant Jain.

## Contributing

- **Issues related to original framework behavior:** open at [vercel/ai issues](https://github.com/vercel/ai/issues)
- **Issues related to guard integration in this fork:** open at [KeelStack-me/ai-with-guard issues](https://github.com/KeelStack-me/ai-with-guard/issues)
- PRs are welcome for improved guard integrations, examples, and production hardening.
