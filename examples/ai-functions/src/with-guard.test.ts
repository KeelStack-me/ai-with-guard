import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { guard } from './keelstack-guard';

function hashArgs(args: unknown) {
  return createHash('sha256').update(JSON.stringify(args)).digest('hex');
}

describe('guard idempotency', () => {
  it('returns cached result on duplicate tool call', async () => {
    let executions = 0;
    const args = { city: 'Berlin' };
    const key = `tool:weather:user-1:${hashArgs(args)}`;

    const first = await guard({
      key,
      action: async () => {
        executions += 1;
        return { weather: 'sunny' };
      },
    });

    const second = await guard({
      key,
      action: async () => {
        executions += 1;
        return { weather: 'rainy' };
      },
    });

    expect(first.status).toBe('executed');
    expect(first.fromCache).toBe(false);
    expect(second.status).toBe('replayed');
    expect(second.fromCache).toBe(true);
    expect(second.value).toEqual({ weather: 'sunny' });
    expect(executions).toBe(1);
  });
});
