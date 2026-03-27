import { describe, it, expect } from 'vitest';
import { dataMinimization } from '../src/data-minimization.js';

describe('data-minimization guard', () => {
  it('passes clean output', async () => {
    const guard = dataMinimization({ action: 'warn' });
    const r = await guard.check('The weather is nice today', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('detects internal IDs', async () => {
    const guard = dataMinimization({ action: 'warn' });
    const r = await guard.check('internal_id: abc123 user object_id = 507f1f77bcf86cd799439011', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('detects debug info', async () => {
    const guard = dataMinimization({ action: 'warn', detectTypes: ['debug-info'] });
    const r = await guard.check('Error at processRequest (server.js:42:15)', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });
});
