import { createRequire } from 'node:module';

// TODO(keelstack-guard>=0.1.1): remove this shim once package exports include dist/index.mjs.
const require = createRequire(import.meta.url);
const guardModule = require('@keelstack/guard') as {
  guard: <T>(options: {
    key: string;
    action: () => Promise<T>;
    ttlMs?: number;
    budget?: unknown;
    extractCost?: (result: T) => number;
    risk?: unknown;
    ledger?: unknown;
    budgetStore?: unknown;
  }) => Promise<{
    status: 'executed' | 'replayed' | 'blocked:budget' | 'blocked:risk';
    value?: T;
    fromCache: boolean;
    replayCount: number;
    budgetInfo?: unknown;
    riskInfo?: unknown;
  }>;
};

export const guard = guardModule.guard;
