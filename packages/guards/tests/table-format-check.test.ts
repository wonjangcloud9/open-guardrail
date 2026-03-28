import { describe, it, expect } from 'vitest';
import { tableFormatCheck } from '../src/table-format-check.js';

const ctx = { pipelineType: 'output' as const };

describe('table-format-check guard', () => {
  it('passes a valid markdown table', async () => {
    const guard = tableFormatCheck({ action: 'warn' });
    const table = '| Name | Age |\n| --- | --- |\n| Alice | 30 |';
    const result = await guard.check(table, ctx);
    expect(result.passed).toBe(true);
  });

  it('detects inconsistent column counts', async () => {
    const guard = tableFormatCheck({ action: 'block' });
    const table = '| A | B | C |\n| --- | --- | --- |\n| 1 | 2 |';
    const result = await guard.check(table, ctx);
    expect(result.passed).toBe(false);
  });

  it('detects missing alignment row', async () => {
    const guard = tableFormatCheck({ action: 'warn' });
    const table = '| A | B |\n| x | y |\n| 1 | 2 |';
    const result = await guard.check(table, ctx);
    expect(result.passed).toBe(false);
  });

  it('passes text without tables', async () => {
    const guard = tableFormatCheck({ action: 'block' });
    const result = await guard.check('No tables here.', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects empty cells', async () => {
    const guard = tableFormatCheck({ action: 'warn' });
    const table = '| A | B |\n| --- | --- |\n|  | data |';
    const result = await guard.check(table, ctx);
    expect(result.passed).toBe(false);
  });
});
