import type { GuardResult } from './types.js';

interface GuardMetric {
  guardName: string;
  totalRuns: number;
  totalPassed: number;
  totalBlocked: number;
  totalWarned: number;
  totalErrors: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  lastRun: number;
}

interface MetricsSnapshot {
  guards: Record<string, GuardMetric>;
  totalRuns: number;
  totalPassed: number;
  totalBlocked: number;
  uptimeMs: number;
}

/**
 * Collect guard execution metrics for monitoring.
 *
 * @example
 * ```typescript
 * const metrics = new GuardMetrics();
 * metrics.record(result);
 * console.log(metrics.snapshot());
 * ```
 */
export class GuardMetrics {
  private data = new Map<string, GuardMetric>();
  private startTime = Date.now();

  record(result: GuardResult): void {
    const name = result.guardName;
    let m = this.data.get(name);

    if (!m) {
      m = {
        guardName: name,
        totalRuns: 0,
        totalPassed: 0,
        totalBlocked: 0,
        totalWarned: 0,
        totalErrors: 0,
        avgLatencyMs: 0,
        minLatencyMs: Infinity,
        maxLatencyMs: 0,
        lastRun: 0,
      };
      this.data.set(name, m);
    }

    m.totalRuns++;
    if (result.passed) m.totalPassed++;
    if (result.action === 'block') m.totalBlocked++;
    if (result.action === 'warn') m.totalWarned++;
    m.lastRun = Date.now();

    const latency = result.latencyMs ?? 0;
    m.avgLatencyMs = m.avgLatencyMs + (latency - m.avgLatencyMs) / m.totalRuns;
    if (latency < m.minLatencyMs) m.minLatencyMs = latency;
    if (latency > m.maxLatencyMs) m.maxLatencyMs = latency;
  }

  recordError(guardName: string): void {
    let m = this.data.get(guardName);
    if (!m) {
      m = {
        guardName,
        totalRuns: 0,
        totalPassed: 0,
        totalBlocked: 0,
        totalWarned: 0,
        totalErrors: 0,
        avgLatencyMs: 0,
        minLatencyMs: Infinity,
        maxLatencyMs: 0,
        lastRun: Date.now(),
      };
      this.data.set(guardName, m);
    }
    m.totalErrors++;
    m.totalRuns++;
    m.lastRun = Date.now();
  }

  get(guardName: string): GuardMetric | undefined {
    return this.data.get(guardName);
  }

  snapshot(): MetricsSnapshot {
    const guards: Record<string, GuardMetric> = {};
    let totalRuns = 0;
    let totalPassed = 0;
    let totalBlocked = 0;

    for (const [name, m] of this.data) {
      guards[name] = { ...m };
      totalRuns += m.totalRuns;
      totalPassed += m.totalPassed;
      totalBlocked += m.totalBlocked;
    }

    return {
      guards,
      totalRuns,
      totalPassed,
      totalBlocked,
      uptimeMs: Date.now() - this.startTime,
    };
  }

  reset(): void {
    this.data.clear();
    this.startTime = Date.now();
  }

  toJSON(): MetricsSnapshot {
    return this.snapshot();
  }
}
