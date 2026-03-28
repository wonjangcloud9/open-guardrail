import { describe, it, expect } from 'vitest';
import { errorMessageSafety } from '../src/error-message-safety.js';

describe('error-message-safety guard', () => {
  it('detects stack traces', async () => {
    const guard = errorMessageSafety({ action: 'block' });
    const result = await guard.check('Error at module.run (/app/src/index.js:42:10)', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects Python tracebacks', async () => {
    const guard = errorMessageSafety({ action: 'block' });
    const result = await guard.check('File "/app/main.py", line 55, in handle', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects database connection strings', async () => {
    const guard = errorMessageSafety({ action: 'block' });
    const result = await guard.check('Connection failed: postgres://admin:pass@db:5432/prod', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects internal IP addresses', async () => {
    const guard = errorMessageSafety({ action: 'warn' });
    const result = await guard.check('Could not connect to server at 192.168.1.100', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects server version leaks', async () => {
    const guard = errorMessageSafety({ action: 'block' });
    const result = await guard.check('Server: nginx/1.24.0', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows clean error messages', async () => {
    const guard = errorMessageSafety({ action: 'block' });
    const result = await guard.check('An unexpected error occurred. Please try again later.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects environment variable leaks', async () => {
    const guard = errorMessageSafety({ action: 'block' });
    const result = await guard.check('Error: DB_PASSWORD=supersecret was not valid', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });
});
