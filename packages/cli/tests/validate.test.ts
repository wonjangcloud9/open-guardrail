import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runValidate } from '../src/commands/validate.js';

describe('validate command', () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'og-test-')); });
  afterEach(() => { rmSync(dir, { recursive: true }); });

  it('validates a correct config', async () => {
    const yaml = 'version: "1"\npipelines:\n  input:\n    guards:\n      - type: keyword\n        action: block\n';
    writeFileSync(join(dir, 'guardrail.yaml'), yaml);
    const result = await runValidate(join(dir, 'guardrail.yaml'));
    expect(result.valid).toBe(true);
  });

  it('returns errors for invalid config', async () => {
    writeFileSync(join(dir, 'bad.yaml'), 'version: "99"\npipelines:\n  input:\n    guards:\n      - type: keyword\n        action: block\n');
    const result = await runValidate(join(dir, 'bad.yaml'));
    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('throws if file not found', async () => {
    await expect(runValidate(join(dir, 'nope.yaml'))).rejects.toThrow();
  });
});
