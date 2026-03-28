import { describe, it, expect } from 'vitest';
import { contextUtilization } from '../src/context-utilization.js';

describe('context-utilization guard', () => {
  it('fails when response ignores context', async () => {
    const guard = contextUtilization({ action: 'warn' });
    const result = await guard.check('I like pizza.', { pipelineType: 'output', context: 'The project uses TypeScript with React for the frontend.' } as any);
    expect(result.passed).toBe(false);
  });

  it('passes when response uses context words', async () => {
    const guard = contextUtilization({ action: 'warn' });
    const result = await guard.check('The project uses TypeScript for type safety with React components.', { pipelineType: 'output', context: 'The project uses TypeScript and React for the frontend.' } as any);
    expect(result.passed).toBe(true);
  });

  it('passes when no context provided', async () => {
    const guard = contextUtilization({ action: 'warn' });
    const result = await guard.check('Any text here.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('respects custom minOverlap', async () => {
    const guard = contextUtilization({ action: 'warn', minOverlap: 0.5 });
    const result = await guard.check('TypeScript is great.', { pipelineType: 'output', context: 'The project uses TypeScript and React for the frontend with Tailwind CSS.' } as any);
    expect(result.passed).toBe(false);
  });

  it('returns overlap ratio in details', async () => {
    const guard = contextUtilization({ action: 'warn' });
    const result = await guard.check('TypeScript React frontend.', { pipelineType: 'output', context: 'TypeScript React frontend code.' } as any);
    expect(result.details).toHaveProperty('overlapRatio');
  });

  it('handles empty context gracefully', async () => {
    const guard = contextUtilization({ action: 'warn' });
    const result = await guard.check('Some text.', { pipelineType: 'output', context: '' } as any);
    expect(result.passed).toBe(true);
  });
});
