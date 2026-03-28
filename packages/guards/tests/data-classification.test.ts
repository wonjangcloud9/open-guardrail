import { describe, it, expect } from 'vitest';
import { dataClassification } from '../src/data-classification.js';
const ctx = { pipelineType: 'input' as const };
describe('data-classification', () => {
  it('detects top secret content', async () => {
    const g = dataClassification({ action: 'block' });
    expect((await g.check('This is top secret information', ctx)).passed).toBe(false);
  });
  it('detects confidential content', async () => {
    const g = dataClassification({ action: 'warn' });
    const r = await g.check('This document is confidential', ctx);
    expect(r.passed).toBe(false);
  });
  it('allows public content', async () => {
    const g = dataClassification({ action: 'block' });
    expect((await g.check('This is public information', ctx)).passed).toBe(true);
  });
  it('respects minLevel option', async () => {
    const g = dataClassification({ action: 'warn', minLevel: 'restricted' });
    expect((await g.check('This is confidential data', ctx)).passed).toBe(true);
  });
  it('flags internal only at internal level', async () => {
    const g = dataClassification({ action: 'block', minLevel: 'internal' });
    expect((await g.check('This is internal only', ctx)).passed).toBe(false);
  });
  it('detects trade secret', async () => {
    const g = dataClassification({ action: 'block' });
    expect((await g.check('Contains trade secret formula', ctx)).passed).toBe(false);
  });
  it('includes classification level in details', async () => {
    const g = dataClassification({ action: 'block' });
    const r = await g.check('eyes only document', ctx);
    expect(r.details?.classificationLevel).toBe('restricted');
  });
});
