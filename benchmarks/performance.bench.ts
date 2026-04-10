import { describe, it, expect } from 'vitest';
import {
  promptInjection,
  pii,
  toxicity,
} from 'open-guardrail-guards';

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function measureLatency(
  fn: () => Promise<unknown>,
  iterations: number,
): Promise<{ avg: number; p50: number; p95: number; p99: number }> {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  return {
    avg,
    p50: percentile(times, 50),
    p95: percentile(times, 95),
    p99: percentile(times, 99),
  };
}

const SAMPLE_TEXT =
  'What are the best practices for building secure REST APIs with Node.js and Express?';
const ITERATIONS = 1000;

describe('Performance Benchmark', () => {
  const piGuard = promptInjection({ action: 'block' });
  const piiGuard = pii({
    entities: ['email', 'phone', 'ssn', 'credit-card'],
    action: 'block',
  });
  const toxGuard = toxicity({ action: 'block' });

  it(`promptInjection: ${ITERATIONS} iterations avg < 0.1ms`, async () => {
    const stats = await measureLatency(
      () => piGuard.check(SAMPLE_TEXT, { pipelineType: 'input' }),
      ITERATIONS,
    );
    console.log(
      `promptInjection — avg: ${stats.avg.toFixed(4)}ms, p50: ${stats.p50.toFixed(4)}ms, p95: ${stats.p95.toFixed(4)}ms, p99: ${stats.p99.toFixed(4)}ms`,
    );
    expect(stats.avg).toBeLessThan(0.1);
  });

  it(`pii: ${ITERATIONS} iterations avg < 0.1ms`, async () => {
    const stats = await measureLatency(
      () => piiGuard.check(SAMPLE_TEXT, { pipelineType: 'input' }),
      ITERATIONS,
    );
    console.log(
      `pii — avg: ${stats.avg.toFixed(4)}ms, p50: ${stats.p50.toFixed(4)}ms, p95: ${stats.p95.toFixed(4)}ms, p99: ${stats.p99.toFixed(4)}ms`,
    );
    expect(stats.avg).toBeLessThan(0.1);
  });

  it(`toxicity: ${ITERATIONS} iterations avg < 0.1ms`, async () => {
    const stats = await measureLatency(
      () => toxGuard.check(SAMPLE_TEXT, { pipelineType: 'input' }),
      ITERATIONS,
    );
    console.log(
      `toxicity — avg: ${stats.avg.toFixed(4)}ms, p50: ${stats.p50.toFixed(4)}ms, p95: ${stats.p95.toFixed(4)}ms, p99: ${stats.p99.toFixed(4)}ms`,
    );
    expect(stats.avg).toBeLessThan(0.1);
  });
});
