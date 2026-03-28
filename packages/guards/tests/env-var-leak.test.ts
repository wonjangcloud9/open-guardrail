import { describe, it, expect } from 'vitest';
import { envVarLeak } from '../src/env-var-leak.js';

describe('env-var-leak guard', () => {
  it('detects process.env reference', async () => {
    const guard = envVarLeak({ action: 'block' });
    const result = await guard.check('The value is process.env.SECRET_KEY', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects os.environ reference', async () => {
    const guard = envVarLeak({ action: 'block' });
    const result = await guard.check('Use os.environ["DATABASE_URL"]', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects %VARIABLE% pattern', async () => {
    const guard = envVarLeak({ action: 'block' });
    const result = await guard.check('Set %PATH% to include bin', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects DATABASE_URL leak', async () => {
    const guard = envVarLeak({ action: 'warn' });
    const result = await guard.check('DATABASE_URL=postgres://user:pass@host/db', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects AWS_SECRET leak', async () => {
    const guard = envVarLeak({ action: 'block' });
    const result = await guard.check('AWS_SECRET_ACCESS_KEY=wJalrXUtn', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = envVarLeak({ action: 'block' });
    const result = await guard.check('Environment variables store configuration', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects ${VAR} pattern', async () => {
    const guard = envVarLeak({ action: 'block' });
    const result = await guard.check('Connection: ${DATABASE_HOST}:5432', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });
});
