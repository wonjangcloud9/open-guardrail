import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../src/event-bus.js';

describe('EventBus', () => {
  it('emits guard:before event', async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('guard:before', handler);
    await bus.emit('guard:before', { guardName: 'pii', text: 'hello' });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('emits guard:after event with result', async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('guard:after', handler);
    const result = { guardName: 'pii', passed: true, action: 'allow' as const, latencyMs: 1 };
    await bus.emit('guard:after', { guardName: 'pii', text: 'hello', result });
    expect(handler).toHaveBeenCalledWith({ guardName: 'pii', text: 'hello', result });
  });

  it('emits guard:blocked event', async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('guard:blocked', handler);
    await bus.emit('guard:blocked', { guardName: 'toxicity', text: 'bad' });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('emits guard:error event', async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('guard:error', handler);
    await bus.emit('guard:error', { guardName: 'pii', error: new Error('boom') });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('removes listener with off()', async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('guard:before', handler);
    bus.off('guard:before', handler);
    await bus.emit('guard:before', { guardName: 'pii', text: 'hello' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('handles async listeners sequentially', async () => {
    const bus = new EventBus();
    const order: number[] = [];
    bus.on('guard:before', async () => { await delay(10); order.push(1); });
    bus.on('guard:before', async () => { order.push(2); });
    await bus.emit('guard:before', { guardName: 'test', text: '' });
    expect(order).toEqual([1, 2]);
  });
});

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
