import { describe, it, expect } from 'vitest';
import { agentPermission } from '../src/agent-permission.js';

describe('agent-permission guard', () => {
  it('blocks denied actions like "rm -rf"', async () => {
    const guard = agentPermission({ action: 'block' });
    const result = await guard.check('Please run rm -rf /tmp/data', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('blocks "DROP TABLE" commands', async () => {
    const guard = agentPermission({ action: 'block' });
    const result = await guard.check('Execute DROP TABLE users', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = agentPermission({ action: 'block' });
    const result = await guard.check('What is the weather today?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('respects allowedActions override', async () => {
    const guard = agentPermission({ action: 'block', allowedActions: ['delete'] });
    const result = await guard.check('Please delete this file', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('respects custom deniedActions', async () => {
    const guard = agentPermission({ action: 'warn', deniedActions: ['deploy', 'rollback'] });
    const result = await guard.check('Please deploy the application', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects "transfer funds" action', async () => {
    const guard = agentPermission({ action: 'block' });
    const result = await guard.check('Transfer funds to account 12345', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });
});
