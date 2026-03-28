import { describe, it, expect } from 'vitest';
import { responseStructureJson } from '../src/response-structure-json.js';

describe('response-structure-json guard', () => {
  it('detects invalid JSON', async () => {
    const guard = responseStructureJson({ action: 'block' });
    const result = await guard.check('not json at all', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('passes valid JSON object', async () => {
    const guard = responseStructureJson({ action: 'block' });
    const result = await guard.check('{"status": "ok"}', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects missing required keys', async () => {
    const guard = responseStructureJson({ action: 'block', requiredKeys: ['name', 'age'] });
    const result = await guard.check('{"name": "Alice"}', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('passes when all required keys present', async () => {
    const guard = responseStructureJson({ action: 'block', requiredKeys: ['name', 'age'] });
    const result = await guard.check('{"name": "Alice", "age": 30}', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects null values for required keys', async () => {
    const guard = responseStructureJson({ action: 'block', requiredKeys: ['name'] });
    const result = await guard.check('{"name": null}', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects non-object JSON (array)', async () => {
    const guard = responseStructureJson({ action: 'block' });
    const result = await guard.check('[1, 2, 3]', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('reports issues in details', async () => {
    const guard = responseStructureJson({ action: 'block', requiredKeys: ['id'] });
    const result = await guard.check('{"name": "test"}', { pipelineType: 'output' });
    expect(result.details?.issues).toContain('missing-key:id');
  });
});
