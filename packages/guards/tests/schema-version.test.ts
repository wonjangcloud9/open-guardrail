import { describe, it, expect } from 'vitest';
import { schemaVersion } from '../src/schema-version.js';

describe('schema-version guard', () => {
  it('passes valid version in range', async () => {
    const guard = schemaVersion({ action: 'block', minVersion: '1.0.0', maxVersion: '3.0.0' });
    const result = await guard.check('{"version": "2.0.0", "data": {}}', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('fails version below minimum', async () => {
    const guard = schemaVersion({ action: 'block', minVersion: '2.0.0' });
    const result = await guard.check('{"version": "1.0.0"}', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('fails version above maximum', async () => {
    const guard = schemaVersion({ action: 'block', maxVersion: '2.0.0' });
    const result = await guard.check('version: "3.5.0"', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects missing version field', async () => {
    const guard = schemaVersion({ action: 'warn' });
    const result = await guard.check('{"name": "test", "data": {}}', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('handles text with no constraints', async () => {
    const guard = schemaVersion({ action: 'block' });
    const result = await guard.check('version: "1.0.0"', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns versions found in details', async () => {
    const guard = schemaVersion({ action: 'block', minVersion: '5.0.0' });
    const result = await guard.check('version="2.1.0"', { pipelineType: 'input' });
    expect(result.details).toBeDefined();
    expect(result.details!.versionsFound).toContain('2.1.0');
  });

  it('has correct metadata', () => {
    const guard = schemaVersion({ action: 'block' });
    expect(guard.name).toBe('schema-version');
    expect(guard.category).toBe('format');
  });
});
