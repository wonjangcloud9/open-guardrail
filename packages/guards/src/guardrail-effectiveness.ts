import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface GuardrailEffectivenessOptions { action: 'block' | 'warn'; windowSize?: number; minPassRate?: number; maxPassRate?: number; }
export function guardrailEffectiveness(options: GuardrailEffectivenessOptions): Guard {
  const windowSize = options.windowSize ?? 50;
  const minPassRate = options.minPassRate ?? 0.3;
  const maxPassRate = options.maxPassRate ?? 0.95;
  const history: boolean[] = [];
  return { name: 'guardrail-effectiveness', version: '0.1.0', description: 'Alert when guard effectiveness degrades', category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const passed = text.trim().length > 0;
      history.push(passed);
      if (history.length > windowSize) history.shift();
      const passCount = history.filter(Boolean).length;
      const passRate = history.length > 0 ? passCount / history.length : 1;
      const prevRate = history.length > 1 ? history.slice(0, -1).filter(Boolean).length / (history.length - 1) : passRate;
      const trend = passRate > prevRate ? 'rising' : passRate < prevRate ? 'falling' : 'stable';
      const tooLow = passRate < minPassRate;
      const tooHigh = passRate > maxPassRate && history.length >= windowSize;
      const triggered = tooLow || tooHigh;
      return { guardName: 'guardrail-effectiveness', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? (tooLow ? `Pass rate too low (${(passRate * 100).toFixed(1)}%) — possible false positive storm` : `Pass rate too high (${(passRate * 100).toFixed(1)}%) — possible bypass`) : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { passRate: Math.round(passRate * 1000) / 1000, trend, windowSize: history.length, threshold: tooLow ? 'below-min' : 'above-max' } : undefined };
    },
  };
}
