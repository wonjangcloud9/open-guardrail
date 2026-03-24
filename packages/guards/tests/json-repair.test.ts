import { describe, it, expect } from 'vitest';
import { jsonRepair } from '../src/json-repair.js';

describe('json-repair guard', () => {
  it('passes valid JSON', async () => {
    const guard = jsonRepair({ action: 'block' });
    const result = await guard.check('{"name":"Alice","age":30}', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('blocks invalid unfixable JSON', async () => {
    const guard = jsonRepair({ action: 'block' });
    const result = await guard.check('not json at all {{{', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('fixes trailing commas in fix mode', async () => {
    const guard = jsonRepair({ action: 'fix' });
    const result = await guard.check('{"a":1,"b":2,}', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('override');
    expect(result.overrideText).toBe('{"a":1,"b":2}');
  });

  it('extracts JSON from markdown code blocks', async () => {
    const guard = jsonRepair({ action: 'fix' });
    const input = 'Here is the result:\n```json\n{"key":"value"}\n```';
    const result = await guard.check(input, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
    expect(result.overrideText).toBe('{"key":"value"}');
  });

  it('fixes single quotes to double quotes', async () => {
    const guard = jsonRepair({ action: 'fix' });
    const result = await guard.check("{'name':'Bob'}", { pipelineType: 'output' });
    expect(result.passed).toBe(true);
    expect(result.overrideText).toBe('{"name":"Bob"}');
  });

  it('warns on fixable JSON in warn mode', async () => {
    const guard = jsonRepair({ action: 'warn' });
    const result = await guard.check('{"a":1,}', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
    expect(result.details?.repaired).toBe(true);
  });
});
