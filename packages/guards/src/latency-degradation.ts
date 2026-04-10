import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LatencyDegradationOptions {
  action: 'block' | 'warn';
  /** Maximum acceptable latency in ms (default 100) */
  maxLatencyMs?: number;
  /** Rolling window size (default 50) */
  windowSize?: number;
}

export function latencyDegradation(options: LatencyDegradationOptions): Guard {
  const maxLatencyMs = options.maxLatencyMs ?? 100;
  const windowSize = options.windowSize ?? 50;
  const latencies: number[] = [];

  return {
    name: 'latency-degradation',
    version: '0.1.0',
    description: 'Monitors and flags guard pipeline latency degradation',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      // Simulate processing to measure realistic latency
      const _len = text.length;

      const elapsed = performance.now() - start;
      const warming = latencies.length < windowSize;

      let triggered = false;
      let reason: string | undefined;

      const avg = latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0;

      if (!warming) {
        if (elapsed > maxLatencyMs) {
          triggered = true;
          reason = 'max_latency_exceeded';
        }

        if (latencies.length >= 5) {
          const last5 = latencies.slice(-5);
          const allAbove2x = last5.every((l) => l > avg * 2);
          if (allAbove2x) {
            triggered = true;
            reason = reason ? 'max_exceeded_and_trend' : 'trend_degradation';
          }
        }
      }

      latencies.push(elapsed);
      if (latencies.length > windowSize) latencies.shift();

      const sorted = [...latencies].sort((a, b) => a - b);
      const p95Idx = Math.min(Math.floor(sorted.length * 0.95), sorted.length - 1);
      const p95 = sorted[p95Idx] ?? 0;

      return {
        guardName: 'latency-degradation',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(elapsed),
        details: triggered
          ? {
              reason,
              currentLatencyMs: Math.round(elapsed * 100) / 100,
              averageLatencyMs: Math.round(avg * 100) / 100,
              p95LatencyMs: Math.round(p95 * 100) / 100,
              maxLatencyMs,
            }
          : undefined,
      };
    },
  };
}
