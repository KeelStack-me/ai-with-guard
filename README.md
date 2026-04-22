# AI SDK + KeelStack Guard

A fork of `vercel/ai` that demonstrates how to add Guard-based runtime safety to AI tool execution: idempotency, per-user budgets, and risk policies for sensitive actions.

[![npm version](https://img.shields.io/npm/v/@keelstack/guard)](https://www.npmjs.com/package/@keelstack/guard)
[![GitHub stars](https://img.shields.io/github/stars/KeelStack-me/ai-with-guard)](https://github.com/KeelStack-me/ai-with-guard)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

> This repository is a **fork of [vercel/ai](https://github.com/vercel/ai)** with Guard integration examples.  
> The guardrails themselves live in [`@keelstack/guard`](https://github.com/KeelStack-me/guard), a lightweight MIT-licensed package for retry-safe side effects in TypeScript AI agents.

## Why this fork exists

AI systems often retry tool calls after timeouts or transient failures. That is usually good for reliability, but it becomes dangerous when the tool has side effects:

- emails can send twice
- charges can fire twice
- records can be duplicated
- expensive model calls can keep accumulating cost

This fork shows how to place `@keelstack/guard` between the caller and the side effect so repeated calls can be replayed safely instead of re-executed.

## What Guard adds

This fork demonstrates three Guard primitives:

- **Idempotency gate** — repeated calls with the same key replay the stored result instead of re-running the action
- **Budget enforcer** — blocks execution if per-user spend exceeds a configured limit
- **Risk gate** — classifies actions as `safe`, `reversible`, or `irreversible`, then allows, logs, warns, or blocks based on policy

The underlying AI SDK remains the Vercel AI SDK. This fork only adds examples and integration points for Guard.

## What changed in this fork

- Guard integrated into tool execution example(s)
- Stable idempotency key format: `tool:${toolName}:${userId}:${hash(args)}`
- Optional per-user budget controls
- Optional risk policy configuration
- Duplicate-prevention example script
- Test coverage for replay behavior

## Quick demo

Install dependencies:

```bash
pnpm install
```

Run the Guard demo:

```bash
pnpm --filter @example/ai-functions exec tsx ../with-guard.ts
```

Expected behavior:

- first call → `status: "executed"`, `fromCache: false`
- second identical call → `status: "replayed"`, `fromCache: true`
- the side effect runs only once

## Example Guard usage

```ts
import { guard } from '@keelstack/guard';
import { createHash } from 'node:crypto';

const key = `tool:${toolName}:${userId}:${createHash('sha256')
  .update(JSON.stringify(args))
  .digest('hex')}`;

const result = await guard({
  key,
  action: () => runTool(args),
  budget: {
    id: userId,
    limitUsd: 5,
    warnAt: [0.5, 0.8],
  },
  extractCost: () => 0.001,
  risk: {
    level: 'irreversible',
    policy: 'warn',
  },
});
```

## Configuration

In `examples/next-agent`, optional environment variables:

- `GUARD_BUDGET_LIMIT_USD` — enable budget capping when set to a number > 0
- `GUARD_RISK_POLICY` — `allow`, `log`, `warn`, or `block`
- `GUARD_RISK_LEVEL` — `safe`, `reversible`, or `irreversible`

## Upstream AI SDK

This repo is based on the open-source [Vercel AI SDK](https://github.com/vercel/ai), a provider-agnostic TypeScript toolkit for building AI-powered applications and agents. For full framework docs, providers, and core SDK usage, see:

- [AI SDK docs](https://sdk.vercel.ai)
- [AI SDK reference](https://sdk.vercel.ai/reference)
- [Original upstream repository](https://github.com/vercel/ai)

## Keeping this fork in sync

This fork is intended to demonstrate and test Guard integrations on top of the Vercel AI SDK. Upstream framework changes should be tracked from `vercel/ai`, and fork updates should be rebased regularly to stay compatible. [web:247]

## Support

- Issues related to the original SDK: open them on [vercel/ai](https://github.com/vercel/ai/issues)
- Issues related to Guard integration in this fork: open them on this repository
- Issues related to the Guard package itself: open them on [KeelStack-me/guard](https://github.com/KeelStack-me/guard)

## Attribution

All credit for the underlying AI SDK goes to the Vercel team and contributors. This repository adds Guard integration examples and experimental runtime-safety wiring on top of the upstream project.