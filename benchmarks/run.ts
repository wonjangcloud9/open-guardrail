/**
 * open-guardrail benchmark suite
 *
 * Usage:
 *   pnpm --filter open-guardrail-benchmarks bench       # table output
 *   pnpm --filter open-guardrail-benchmarks bench:json   # JSON output
 */
import { pipe, createPipeline } from 'open-guardrail-core';
import {
  promptInjection,
  keyword,
  pii,
  regex,
  toxicity,
  wordCount,
  piiKr,
} from 'open-guardrail-guards';
import * as fixtures from './fixtures.js';

interface BenchResult {
  name: string;
  ops: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
}

const WARMUP = 50;
const ITERATIONS = 500;

async function bench(
  name: string,
  fn: () => Promise<unknown>,
): Promise<BenchResult> {
  // warmup
  for (let i = 0; i < WARMUP; i++) await fn();

  const times: number[] = [];
  const start = performance.now();

  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    await fn();
    times.push(performance.now() - t0);
  }

  const elapsed = performance.now() - start;
  times.sort((a, b) => a - b);

  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  const p = (pct: number) => times[Math.floor(times.length * pct)] ?? 0;

  return {
    name,
    ops: Math.round((ITERATIONS / elapsed) * 1000),
    avgMs: round(avg),
    p50Ms: round(p(0.5)),
    p95Ms: round(p(0.95)),
    p99Ms: round(p(0.99)),
    minMs: round(times[0]),
    maxMs: round(times[times.length - 1]),
  };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// ─── Benchmarks ───

const suites: Array<{ name: string; fn: () => Promise<unknown> }> = [];

function add(name: string, fn: () => Promise<unknown>) {
  suites.push({ name, fn });
}

// Single guard benchmarks
const piGuard = promptInjection({ action: 'block' });
add('promptInjection — short safe', () => piGuard.check(fixtures.SHORT_SAFE, { pipelineType: 'input' }));
add('promptInjection — injection', () => piGuard.check(fixtures.INJECTION_ATTEMPT, { pipelineType: 'input' }));
add('promptInjection — long text', () => piGuard.check(fixtures.LONG_SAFE, { pipelineType: 'input' }));

const kwGuard = keyword({ denied: ['hack', 'exploit', 'jailbreak', 'DAN', 'ignore'], action: 'block' });
add('keyword — short safe', () => kwGuard.check(fixtures.SHORT_SAFE, { pipelineType: 'input' }));
add('keyword — injection', () => kwGuard.check(fixtures.INJECTION_ATTEMPT, { pipelineType: 'input' }));

const piiGuard = pii({ entities: ['email', 'phone', 'ssn', 'credit-card'], action: 'mask' });
add('pii(mask) — clean text', () => piiGuard.check(fixtures.SHORT_SAFE, { pipelineType: 'input' }));
add('pii(mask) — PII text', () => piiGuard.check(fixtures.PII_TEXT, { pipelineType: 'input' }));
add('pii(mask) — long mixed', () => piiGuard.check(fixtures.MIXED_LONG, { pipelineType: 'input' }));

const rgxGuard = regex({ patterns: [/\bpassword\b/i, /\bsecret\b/i, /\btoken\b/i], action: 'warn' });
add('regex — safe', () => rgxGuard.check(fixtures.SHORT_SAFE, { pipelineType: 'input' }));
add('regex — long text', () => rgxGuard.check(fixtures.LONG_SAFE, { pipelineType: 'input' }));

const toxGuard = toxicity({ action: 'block' });
add('toxicity — safe', () => toxGuard.check(fixtures.SHORT_SAFE, { pipelineType: 'input' }));
add('toxicity — toxic', () => toxGuard.check(fixtures.TOXIC_TEXT, { pipelineType: 'input' }));

const wcGuard = wordCount({ max: 500, action: 'block' });
add('wordCount — short', () => wcGuard.check(fixtures.SHORT_SAFE, { pipelineType: 'input' }));
add('wordCount — long', () => wcGuard.check(fixtures.LONG_SAFE, { pipelineType: 'input' }));

const krGuard = piiKr({ entities: ['resident-id', 'passport'], action: 'mask' });
add('piiKr(mask) — clean', () => krGuard.check(fixtures.SHORT_SAFE, { pipelineType: 'input' }));
add('piiKr(mask) — korean PII', () => krGuard.check(fixtures.KOREAN_PII, { pipelineType: 'input' }));

// Pipeline benchmarks
const lightPipeline = pipe(
  promptInjection({ action: 'block' }),
  keyword({ denied: ['hack', 'exploit'], action: 'block' }),
  wordCount({ max: 1000, action: 'block' }),
);
add('pipeline(3 guards) — short safe', () => lightPipeline.run(fixtures.SHORT_SAFE));
add('pipeline(3 guards) — injection', () => lightPipeline.run(fixtures.INJECTION_ATTEMPT));

const fullPipeline = pipe(
  promptInjection({ action: 'block' }),
  keyword({ denied: ['hack', 'exploit', 'jailbreak'], action: 'block' }),
  pii({ entities: ['email', 'phone', 'ssn'], action: 'mask' }),
  toxicity({ action: 'warn' }),
  wordCount({ max: 2000, action: 'block' }),
  regex({ patterns: [/\bpassword\b/i], action: 'warn' }),
);
add('pipeline(6 guards) — short safe', () => fullPipeline.run(fixtures.SHORT_SAFE));
add('pipeline(6 guards) — long safe', () => fullPipeline.run(fixtures.LONG_SAFE));
add('pipeline(6 guards) — PII text', () => fullPipeline.run(fixtures.PII_TEXT));
add('pipeline(6 guards) — long mixed', () => fullPipeline.run(fixtures.MIXED_LONG));

// ─── Runner ───

async function main() {
  const jsonMode = process.argv.includes('--json');
  const results: BenchResult[] = [];

  if (!jsonMode) {
    console.log(`\n  open-guardrail benchmark`);
    console.log(`  ${ITERATIONS} iterations, ${WARMUP} warmup\n`);
  }

  for (const suite of suites) {
    const result = await bench(suite.name, suite.fn);
    results.push(result);
    if (!jsonMode) {
      const opsStr = String(result.ops).padStart(7);
      console.log(
        `  ${opsStr} ops/s  avg ${result.avgMs.toFixed(3).padStart(7)}ms` +
        `  p95 ${result.p95Ms.toFixed(3).padStart(7)}ms` +
        `  ${result.name}`,
      );
    }
  }

  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
