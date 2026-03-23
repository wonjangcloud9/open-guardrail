import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInit } from '../src/commands/init.js';

describe('init command', () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'og-test-')); });
  afterEach(() => { rmSync(dir, { recursive: true }); });

  it('creates guardrail.yaml with default preset', async () => {
    await runInit(dir, 'default');
    const file = join(dir, 'guardrail.yaml');
    expect(existsSync(file)).toBe(true);
    const content = readFileSync(file, 'utf-8');
    expect(content).toContain('version: "1"');
  });

  it('creates guardrail.yaml with strict preset', async () => {
    await runInit(dir, 'strict');
    const content = readFileSync(join(dir, 'guardrail.yaml'), 'utf-8');
    expect(content).toContain('pii');
  });

  it('does not overwrite existing file', async () => {
    await runInit(dir, 'default');
    await expect(runInit(dir, 'default')).rejects.toThrow(/already exists/i);
  });
});
