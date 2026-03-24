import { describe, it, expect } from 'vitest';
import { toolCallValidator } from '../src/tool-call-validator.js';

describe('tool-call-validator guard', () => {
  it('passes valid tool call', async () => {
    const guard = toolCallValidator({
      action: 'block',
      rules: [{ tool: 'sendEmail', arg: 'to', validate: 'email' }],
    });
    const input = JSON.stringify({ tool: 'sendEmail', args: { to: 'user@example.com', body: 'hello' } });
    const result = await guard.check(input, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('blocks invalid email in tool arg', async () => {
    const guard = toolCallValidator({
      action: 'block',
      rules: [{ tool: 'sendEmail', arg: 'to', validate: 'email' }],
    });
    const input = JSON.stringify({ tool: 'sendEmail', args: { to: 'not-an-email', body: 'hello' } });
    const result = await guard.check(input, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('blocks SQL injection in any tool arg', async () => {
    const guard = toolCallValidator({
      action: 'block',
      rules: [{ tool: '*', arg: '*', denyPatterns: [/DROP\s+TABLE/i, /;\s*DELETE/i] }],
    });
    const input = JSON.stringify({ tool: 'queryDB', args: { query: 'SELECT * FROM users; DELETE FROM users' } });
    const result = await guard.check(input, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('validates uuid format', async () => {
    const guard = toolCallValidator({
      action: 'block',
      rules: [{ tool: 'getUser', arg: 'id', validate: 'uuid' }],
    });
    const valid = JSON.stringify({ tool: 'getUser', args: { id: '550e8400-e29b-41d4-a716-446655440000' } });
    const invalid = JSON.stringify({ tool: 'getUser', args: { id: 'fake-id-123' } });

    expect((await guard.check(valid, { pipelineType: 'output' })).passed).toBe(true);
    expect((await guard.check(invalid, { pipelineType: 'output' })).passed).toBe(false);
  });

  it('blocks disallowed tool names', async () => {
    const guard = toolCallValidator({
      action: 'block',
      allowedTools: ['search', 'getWeather'],
      rules: [],
    });
    const input = JSON.stringify({ tool: 'deleteAllData', args: {} });
    const result = await guard.check(input, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.reason).toContain('not allowed');
  });

  it('allows non-JSON text (passthrough)', async () => {
    const guard = toolCallValidator({ action: 'block', rules: [] });
    const result = await guard.check('just regular text', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
