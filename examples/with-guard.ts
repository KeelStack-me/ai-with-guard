import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { guard } = require('@keelstack/guard') as {
  guard: <T>(options: {
    key: string;
    action: () => Promise<T>;
    budget?: unknown;
    extractCost?: (result: T) => number;
    risk?: unknown;
  }) => Promise<{
    status: 'executed' | 'replayed' | 'blocked:budget' | 'blocked:risk';
    value?: T;
    fromCache: boolean;
    replayCount: number;
  }>;
};

type ToolArgs = { amountUsd: number; invoiceId: string };

function hashArgs(args: ToolArgs) {
  return createHash('sha256').update(JSON.stringify(args)).digest('hex');
}

let sideEffectExecutions = 0;

async function chargeCustomer(args: ToolArgs) {
  sideEffectExecutions += 1;
  console.log(`charging customer for invoice ${args.invoiceId}`);

  return {
    charged: true,
    amountUsd: args.amountUsd,
    invoiceId: args.invoiceId,
  };
}

async function runAgentToolCall({
  toolName,
  userId,
  args,
}: {
  toolName: string;
  userId: string;
  args: ToolArgs;
}) {
  return guard({
    key: `tool:${toolName}:${userId}:${hashArgs(args)}`,
    action: () => chargeCustomer(args),
    budget: {
      id: userId,
      limitUsd: 5,
      warnAt: [0.5, 0.8],
    },
    extractCost: result => result.amountUsd,
    risk: {
      level: 'irreversible',
      policy: 'warn',
    },
  });
}

async function main() {
  const payload = { amountUsd: 1, invoiceId: 'inv_123' };

  const first = await runAgentToolCall({
    toolName: 'chargeCustomer',
    userId: 'demo-user-1',
    args: payload,
  });

  const second = await runAgentToolCall({
    toolName: 'chargeCustomer',
    userId: 'demo-user-1',
    args: payload,
  });

  console.log({
    firstCall: {
      status: first.status,
      fromCache: first.fromCache,
      value: first.value,
    },
    secondCall: {
      status: second.status,
      fromCache: second.fromCache,
      replayCount: second.replayCount,
      value: second.value,
    },
    sideEffectExecutions,
  });
}

void main();
