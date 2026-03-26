import { describe, it, expect } from 'vitest';
import { GuardMetrics } from '../src/metrics.js';

describe('GuardMetrics', () => {
  it('records guard results', () => {
    const m = new GuardMetrics();
    m.record({ guardName: 'test', passed: true, action: 'allow', latencyMs: 5 });
    m.record({ guardName: 'test', passed: false, action: 'block', latencyMs: 10 });
    const g = m.get('test')!;
    expect(g.totalRuns).toBe(2);
    expect(g.totalPassed).toBe(1);
    expect(g.totalBlocked).toBe(1);
  });

  it('calculates average latency', () => {
    const m = new GuardMetrics();
    m.record({ guardName: 'test', passed: true, action: 'allow', latencyMs: 10 });
    m.record({ guardName: 'test', passed: true, action: 'allow', latencyMs: 20 });
    const g = m.get('test')!;
    expect(g.avgLatencyMs).toBe(15);
  });

  it('tracks min/max latency', () => {
    const m = new GuardMetrics();
    m.record({ guardName: 'test', passed: true, action: 'allow', latencyMs: 5 });
    m.record({ guardName: 'test', passed: true, action: 'allow', latencyMs: 50 });
    const g = m.get('test')!;
    expect(g.minLatencyMs).toBe(5);
    expect(g.maxLatencyMs).toBe(50);
  });

  it('records errors', () => {
    const m = new GuardMetrics();
    m.recordError('test');
    m.recordError('test');
    const g = m.get('test')!;
    expect(g.totalErrors).toBe(2);
    expect(g.totalRuns).toBe(2);
  });

  it('produces snapshot with totals', () => {
    const m = new GuardMetrics();
    m.record({ guardName: 'a', passed: true, action: 'allow', latencyMs: 1 });
    m.record({ guardName: 'b', passed: false, action: 'block', latencyMs: 2 });
    const snap = m.snapshot();
    expect(snap.totalRuns).toBe(2);
    expect(snap.totalPassed).toBe(1);
    expect(snap.totalBlocked).toBe(1);
    expect(snap.uptimeMs).toBeGreaterThanOrEqual(0);
  });

  it('resets metrics', () => {
    const m = new GuardMetrics();
    m.record({ guardName: 'test', passed: true, action: 'allow', latencyMs: 1 });
    m.reset();
    expect(m.snapshot().totalRuns).toBe(0);
  });
});
