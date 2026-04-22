import { UIToolInvocation, tool } from 'ai';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { guard } from '../lib/keelstack-guard';

const guardBudgetLimitUsd = Number(process.env.GUARD_BUDGET_LIMIT_USD ?? '0');
const guardApprovalPolicy =
  process.env.GUARD_APPROVAL_POLICY === 'block' ? 'block' : 'warn';
const guardRiskLevel =
  process.env.GUARD_RISK_LEVEL === 'reversible' ||
  process.env.GUARD_RISK_LEVEL === 'irreversible'
    ? process.env.GUARD_RISK_LEVEL
    : 'safe';

function createToolArgsHash(args: unknown) {
  return createHash('sha256').update(JSON.stringify(args)).digest('hex');
}

export const weatherTool = tool({
  description: 'Get the weather in a location',
  inputSchema: z.object({
    city: z.string(),
    userId: z.string().default('anonymous'),
  }),
  async *execute({ city, userId }: { city: string; userId: string }) {
    yield { state: 'loading' as const };

    const toolName = 'weather';
    const toolArgs = { city };
    const idempotencyKey = `tool:${toolName}:${userId}:${createToolArgsHash(toolArgs)}`;

    const weatherResult = await guard({
      key: idempotencyKey,
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
        const weather =
          weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

        return {
          temperature: 72,
          weather,
        };
      },
      ...(guardBudgetLimitUsd > 0
        ? {
            budget: {
              id: userId,
              limitUsd: guardBudgetLimitUsd,
              warnAt: [0.5, 0.8],
              onWarn: ({
                id,
                percentUsed,
              }: {
                id: string;
                percentUsed: number;
              }) => {
                console.warn(
                  `Guard budget warning for ${id}: ${(percentUsed * 100).toFixed(0)}% used`,
                );
              },
            },
            extractCost: () => 0.001,
          }
        : {}),
      risk: {
        level: guardRiskLevel,
        policy: guardApprovalPolicy,
      },
    });

    if (!weatherResult.value) {
      yield {
        state: 'ready' as const,
        temperature: 0,
        weather: 'blocked',
        guardStatus: weatherResult.status,
        fromCache: weatherResult.fromCache,
      };
      return;
    }

    yield {
      state: 'ready' as const,
      ...weatherResult.value,
      guardStatus: weatherResult.status,
      fromCache: weatherResult.fromCache,
      replayCount: weatherResult.replayCount,
    };
  },
});

export type WeatherUIToolInvocation = UIToolInvocation<typeof weatherTool>;
