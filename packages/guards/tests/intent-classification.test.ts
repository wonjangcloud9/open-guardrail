import { describe, it, expect } from 'vitest';
import { intentClassification } from '../src/intent-classification.js';

const ctx = { pipelineType: 'input' as const };

describe('intent-classification guard', () => {
  it('allows questions when permitted', async () => {
    const guard = intentClassification({ action: 'block', allowedIntents: ['question'] });
    const result = await guard.check('What is the weather today?', ctx);
    expect(result.passed).toBe(true);
    expect(result.details?.intent).toBe('question');
  });

  it('blocks commands when not permitted', async () => {
    const guard = intentClassification({ action: 'block', allowedIntents: ['question', 'request'] });
    const result = await guard.check('Delete all files now', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.intent).toBe('command');
  });
});
