import { describe, it, expect } from 'vitest';
import { OpenGuardrail } from '../src/open-guardrail.js';
import type { Guard, GuardResult } from '../src/types.js';

const dummyGuard: Guard = {
  name: 'keyword', version: '1.0.0', description: 'test',
  category: 'security', supportedStages: ['input', 'output'],
  async check(text: string): Promise<GuardResult> {
    const blocked = text.includes('bad');
    return { guardName: 'keyword', passed: !blocked, action: blocked ? 'block' : 'allow', latencyMs: 0 };
  },
};

describe('OpenGuardrail', () => {
  it('builds pipeline from YAML config string', async () => {
    const yaml = `
version: "1"
pipelines:
  input:
    mode: fail-fast
    guards:
      - type: keyword
        action: block
        config:
          denied: ["bad"]
`;
    const og = OpenGuardrail.fromString(yaml);
    og.registerGuard('keyword', () => dummyGuard);
    const result = await og.run('bad word', 'input');
    expect(result.passed).toBe(false);
  });

  it('builds from object (Edge/browser)', () => {
    const config = {
      version: '1' as const,
      pipelines: {
        input: {
          mode: 'fail-fast' as const,
          onError: 'block' as const,
          timeoutMs: 5000,
          guards: [{ type: 'keyword', action: 'block' as const, config: {} }],
        },
      },
    };
    const og = OpenGuardrail.fromObject(config);
    og.registerGuard('keyword', () => dummyGuard);
    expect(og).toBeDefined();
  });

  it('runs output pipeline', async () => {
    const yaml = `
version: "1"
pipelines:
  output:
    guards:
      - type: keyword
        action: block
`;
    const og = OpenGuardrail.fromString(yaml);
    og.registerGuard('keyword', () => dummyGuard);
    const result = await og.run('safe text', 'output');
    expect(result.passed).toBe(true);
  });

  it('throws if pipeline type not configured', async () => {
    const yaml = `
version: "1"
pipelines:
  input:
    guards:
      - type: keyword
        action: block
`;
    const og = OpenGuardrail.fromString(yaml);
    og.registerGuard('keyword', () => dummyGuard);
    await expect(og.run('text', 'output')).rejects.toThrow(/not configured/i);
  });
});
