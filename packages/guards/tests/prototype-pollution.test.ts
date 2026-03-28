import { describe, it, expect } from 'vitest';
import { prototypePollution } from '../src/prototype-pollution.js';

const ctx = { pipelineType: 'input' as const };

describe('prototype-pollution guard', () => {
  it('detects __proto__ access', async () => {
    const guard = prototypePollution({ action: 'block' });
    const result = await guard.check('obj.__proto__.isAdmin = true', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects constructor.prototype', async () => {
    const guard = prototypePollution({ action: 'block' });
    const result = await guard.check('obj.constructor.prototype.admin = true', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects bracket notation __proto__', async () => {
    const guard = prototypePollution({ action: 'block' });
    const result = await guard.check('obj["__proto__"]["isAdmin"] = true', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects JSON.parse with __proto__', async () => {
    const guard = prototypePollution({ action: 'warn' });
    const result = await guard.check('JSON.parse(\'{"__proto__":{"admin":true}}\')', ctx);
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects Object.assign usage', async () => {
    const guard = prototypePollution({ action: 'block' });
    const result = await guard.check('Object.assign(target, untrustedInput)', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows safe code', async () => {
    const guard = prototypePollution({ action: 'block' });
    const result = await guard.check('const user = { name: "Alice", role: "admin" }', ctx);
    expect(result.passed).toBe(true);
  });
});
