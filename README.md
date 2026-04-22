# AI SDK + KeelStack Guard – Production-ready duplicate prevention

[![npm version](https://img.shields.io/npm/v/@keelstack/guard)](https://www.npmjs.com/package/@keelstack/guard)
[![GitHub stars](https://img.shields.io/github/stars/KeelStack-me/ai-with-guard)](https://github.com/KeelStack-me/ai-with-guard)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

**Duplicate tool calls cost money and cause errors. This fork adds idempotency, budgets, and approval gates using `@keelstack/guard`.**  
You get the full power of the Vercel AI SDK plus production-grade guardrails.

---

## Why this fork exists

AI agents often retry tool calls. Without guardrails, retries can trigger duplicate charges, duplicate writes, and unsafe irreversible actions.

This fork integrates `@keelstack/guard` into tool execution so you get:

- **Idempotency (core):** stable key‑based duplicate prevention
- **Budget limits:** per‑user spend controls (configurable)
- **Approval gates:** risk‑based policy (`warn` or `block`) for sensitive actions

All of the original AI SDK features remain untouched and fully functional.

---

## Quick start with guard

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
- Added approval‑gate style risk policy via `GUARD_APPROVAL_POLICY` (`warn` or `block`)
- Added complete duplicate‑prevention demo: `examples/with-guard.ts`
- Added idempotency test: `examples/ai-functions/src/with-guard.test.ts`

## Original vs this fork

| Capability | Original starter | This fork (`ai-with-guard`) |
|---|---|---|
| Basic AI tool calling | ✅ | ✅ |
| Idempotent tool execution | ❌ | ✅ |
| Duplicate call replay handling | ❌ | ✅ |
| Per‑user budget limits | ❌ | ✅ |
| Approval/risk gates | ❌ | ✅ |
| Guard‑focused example | ❌ | ✅ |

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

---

# Underlying library: Vercel AI SDK

![hero illustration](./packages/ai/assets/hero.gif)

The [AI SDK](https://sdk.vercel.ai) is a provider-agnostic library with built-in LLM integrations and a unified API for streaming text, generating objects, and calling tools. It works with the most popular AI providers (OpenAI, Anthropic, Google, etc.) and can be used with Node.js, the Web, or Edge Runtime. The SDK is framework-agnostic and works great with Next.js, React, Svelte, Vue, and other JavaScript frameworks.

To learn more, check out the [documentation](https://sdk.vercel.ai) and the [API reference](https://sdk.vercel.ai/reference).

## Quick Start

Install the SDK using npm:

```bash
npm install ai
```

Then you can use it in your application:

```typescript
import { generateText } from 'ai';

const { text } = await generateText({
  model: 'openai/gpt-4-turbo',
  prompt: 'Invent a new holiday and describe its traditions.',
});
```

## Providers

The AI SDK supports providers including OpenAI, Anthropic, Google, Cohere, Mistral, and many others. You can also use the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) to access multiple providers through a single interface.

```bash
npm install @ai-sdk/openai
npm install @ai-sdk/anthropic
npm install @ai-sdk/google
```

All providers have a consistent API:

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: 'Invent a new holiday and describe its traditions.',
});
```

## Features

### Text Generation

Generate and stream text to your application:

```typescript
import { streamText } from 'ai';

const result = await streamText({
  model: openai('gpt-4-turbo'),
  prompt: 'What is the meaning of life?',
});

for await (const chunk of result.fullStream) {
  console.log(chunk);
}
```

### Object Generation

Structured generation with full type safety:

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';

const { object } = await generateObject({
  model: openai('gpt-4-turbo'),
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
      steps: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a lasagna recipe.',
});
```

### Tool Use

Enable your models to call tools and functions:

```typescript
import { generateText, tool } from 'ai';
import { z } from 'zod';

const { text } = await generateText({
  model: openai('gpt-4-turbo'),
  tools: {
    weather: tool({
      description: 'Get the weather for a location',
      parameters: z.object({ location: z.string() }),
      execute: async ({ location }) => `Weather in ${location}`,
    }),
  },
  prompt: 'What is the weather in San Francisco?',
});
```

### Agentic Loops

Build agents with tool use loops:

```typescript
import { generateText, tool } from 'ai';

let messages = [];
while (true) {
  const response = await generateText({
    model: openai('gpt-4-turbo'),
    system: 'You are a helpful assistant with access to tools.',
    tools: { /* your tools */ },
    messages,
  });

  if (response.toolCalls.length === 0) break;

  for (const toolCall of response.toolCalls) {
    const result = await executeTool(toolCall);
    messages.push({
      role: 'assistant',
      content: response.text,
    });
    messages.push({
      role: 'user',
      content: result,
    });
  }
}
```

## UI Components

The AI SDK includes React hooks for building AI chat interfaces:

```typescript
'use client';

import { useChat } from '@ai-sdk/react';

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <form onSubmit={handleSubmit}>
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}
      <input value={input} onChange={handleInputChange} />
      <button type="submit">Send</button>
    </form>
  );
}
```

Similar hooks are available for Vue and Svelte:

```typescript
// @ai-sdk/vue
import { useChat } from '@ai-sdk/vue';

// @ai-sdk/svelte
import { useChat } from '@ai-sdk/svelte';
```

## Examples

You'll find examples in the [examples](./examples) directory of the repository:

- [Next.js](./examples/next)
- [Node.js](./examples/node-http-server)
- [Svelte](./examples/sveltekit-openai)
- [And many more...](./examples)

## Installation & Setup

### Requirements

- Node.js 18+
- pnpm 10+ (or npm 8+)

### Getting Started

1. Clone the repository:

```bash
git clone https://github.com/vercel/ai.git
cd ai
```

2. Install dependencies:

```bash
pnpm install
```

3. Build the packages:

```bash
pnpm build
```

4. Run tests:

```bash
pnpm test
```

5. Check code quality:

```bash
pnpm check
```

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md) and [Architecture](./contributing/provider-architecture.md) documentation to get started.

## Documentation

- [SDK Documentation](https://sdk.vercel.ai)
- [API Reference](https://sdk.vercel.ai/reference)
- [Guides](https://sdk.vercel.ai/docs/guides)
- [Examples](./examples)

## Community

The AI SDK community can be found on the [Vercel Community](https://community.vercel.com) where you can ask questions and share your projects.

## License

Apache License 2.0 – see [LICENSE](./LICENSE) for details.

## Attribution

This repository is a fork of [vercel/ai](https://github.com/vercel/ai). All credit to the original authors. Guard integration by Siddhant Jain.

## Contributing to this fork

- **Issues related to original framework behavior:** open at [vercel/ai issues](https://github.com/vercel/ai/issues)
- **Issues related to guard integration in this fork:** open at [KeelStack-me/ai-with-guard issues](https://github.com/KeelStack-me/ai-with-guard/issues)
- PRs are welcome for improved guard integrations, examples, and production hardening.