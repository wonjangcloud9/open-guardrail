import { describe, it, expect } from 'vitest';
import { instructionAdherence } from '../src/instruction-adherence.js';
const ctx = { pipelineType: 'output' as const };
describe('instruction-adherence', () => {
  it('blocks missing required phrase', async () => {
    const g = instructionAdherence({ action: 'block', requiredPhrases: ['Summary:'] });
    expect((await g.check('Here is some text', ctx)).passed).toBe(false);
  });
  it('blocks forbidden phrase', async () => {
    const g = instructionAdherence({ action: 'block', forbiddenPhrases: ['I think'] });
    expect((await g.check('I think this is good', ctx)).passed).toBe(false);
  });
  it('validates mustStartWith', async () => {
    const g = instructionAdherence({ action: 'block', mustStartWith: '{' });
    expect((await g.check('{"key": "value"}', ctx)).passed).toBe(true);
    expect((await g.check('Not JSON', ctx)).passed).toBe(false);
  });
  it('allows compliant response', async () => {
    const g = instructionAdherence({ action: 'block', requiredPhrases: ['answer'], maxLength: 100 });
    expect((await g.check('The answer is 42', ctx)).passed).toBe(true);
  });
});
