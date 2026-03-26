import { describe, it, expect } from 'vitest';
import { promptLeak } from '../src/prompt-leak.js';
const ctx = { pipelineType: 'output' as const };
describe('prompt-leak', () => {
  it('detects system prompt mention', async () => { expect((await promptLeak({ action: 'block' }).check('My instructions say I should not reveal this', ctx)).passed).toBe(false); });
  it('detects snippet leak', async () => { expect((await promptLeak({ action: 'block', systemPromptSnippets: ['You are a helpful assistant'] }).check('As per my instructions, You are a helpful assistant', ctx)).passed).toBe(false); });
  it('allows normal response', async () => { expect((await promptLeak({ action: 'block' }).check('The capital of France is Paris.', ctx)).passed).toBe(true); });
});
