import { describe, it, expect } from 'vitest';
import { configLeakDetect } from '../src/config-leak-detect.js';

const ctx = { pipelineType: 'output' as const };

describe('config-leak-detect guard', () => {
  it('detects database URLs', async () => {
    const guard = configLeakDetect({ action: 'block' });
    const result = await guard.check('Connect to postgres://admin:pass@db.example.com/mydb', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.findings[0].type).toBe('database-url');
  });

  it('allows safe content', async () => {
    const guard = configLeakDetect({ action: 'warn' });
    const result = await guard.check('Use the settings panel to configure your preferences.', ctx);
    expect(result.passed).toBe(true);
  });
});
