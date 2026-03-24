import { describe, it, expect } from 'vitest';
import { StreamingPipeline } from '../src/streaming-pipeline.js';
import type { Guard, GuardResult } from '../src/types.js';

function makeStreamGuard(name: string, opts: { blockWord?: string } = {}): Guard {
  return {
    name,
    version: '1.0.0',
    description: `test streaming guard ${name}`,
    category: 'custom',
    supportedStages: ['output'],
    supportsStreaming: true,
    async check(text: string): Promise<GuardResult> {
      const blocked = opts.blockWord ? text.includes(opts.blockWord) : false;
      return { guardName: name, passed: !blocked, action: blocked ? 'block' : 'allow', latencyMs: 0 };
    },
    async checkChunk(chunk: string): Promise<GuardResult> {
      const blocked = opts.blockWord ? chunk.includes(opts.blockWord) : false;
      return { guardName: name, passed: !blocked, action: blocked ? 'block' : 'allow', latencyMs: 0 };
    },
  };
}

async function* toAsyncIterable(chunks: string[]): AsyncIterable<string> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

describe('StreamingPipeline', () => {
  it('processes chunks and returns final result', async () => {
    const guard = makeStreamGuard('g1');
    const sp = new StreamingPipeline({ guards: [guard] });
    const result = await sp.runStream(toAsyncIterable(['hello ', 'world']));
    expect(result.passed).toBe(true);
    expect(result.input).toBe('hello world');
  });

  it('blocks on chunk containing bad word', async () => {
    const guard = makeStreamGuard('g1', { blockWord: 'bad' });
    const sp = new StreamingPipeline({ guards: [guard] });
    const result = await sp.runStream(toAsyncIterable(['good ', 'bad ', 'text']));
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('runs non-streaming guards on full text after stream ends', async () => {
    const fullGuard: Guard = {
      name: 'full-only',
      version: '1.0.0',
      description: 'only checks full text',
      category: 'custom',
      supportedStages: ['output'],
      async check(text: string): Promise<GuardResult> {
        const blocked = text.includes('secret');
        return { guardName: 'full-only', passed: !blocked, action: blocked ? 'block' : 'allow', latencyMs: 0 };
      },
    };
    const sp = new StreamingPipeline({ guards: [fullGuard] });
    const result = await sp.runStream(toAsyncIterable(['no ', 'secret ', 'here']));
    expect(result.passed).toBe(false);
  });

  it('collects chunks via onChunk callback', async () => {
    const guard = makeStreamGuard('g1');
    const sp = new StreamingPipeline({ guards: [guard] });
    const chunks: string[] = [];
    await sp.runStream(toAsyncIterable(['a', 'b', 'c']), { onChunk: (c) => chunks.push(c) });
    expect(chunks).toEqual(['a', 'b', 'c']);
  });

  it('stops emitting chunks after block in fail-fast', async () => {
    const guard = makeStreamGuard('g1', { blockWord: 'stop' });
    const sp = new StreamingPipeline({ guards: [guard], mode: 'fail-fast' });
    const chunks: string[] = [];
    await sp.runStream(toAsyncIterable(['ok ', 'stop ', 'more']), { onChunk: (c) => chunks.push(c) });
    expect(chunks).toEqual(['ok ']);
  });
});
