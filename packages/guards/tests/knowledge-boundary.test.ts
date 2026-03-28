import { describe, it, expect } from 'vitest';
import { knowledgeBoundary } from '../src/knowledge-boundary.js';

describe('knowledge-boundary guard', () => {
  it('detects "I know for certain" claims', async () => {
    const guard = knowledgeBoundary({ action: 'warn' });
    const result = await guard.check('I know for certain that this company will succeed', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects "latest data shows" claims', async () => {
    const guard = knowledgeBoundary({ action: 'block' });
    const result = await guard.check('The latest data shows unemployment is at 3.2%', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects real-time data claims', async () => {
    const guard = knowledgeBoundary({ action: 'block' });
    const result = await guard.check('The real-time price shows Bitcoin at $45,000', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects browsing claims', async () => {
    const guard = knowledgeBoundary({ action: 'block' });
    const result = await guard.check('I just checked the website and found the info', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows hedged language', async () => {
    const guard = knowledgeBoundary({ action: 'block' });
    const result = await guard.check('Based on my training data, the population was approximately 330 million', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('allows general knowledge statements', async () => {
    const guard = knowledgeBoundary({ action: 'block' });
    const result = await guard.check('Python is a popular programming language used for many applications', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns matched patterns in details', async () => {
    const guard = knowledgeBoundary({ action: 'block' });
    const result = await guard.check('I know for certain that the current price is $100', { pipelineType: 'output' });
    expect(result.details).toBeDefined();
    expect((result.details as any).matched.length).toBeGreaterThanOrEqual(1);
  });
});
