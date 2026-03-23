import { describe, it, expect } from 'vitest';
import { GuardError } from '../src/errors.js';

describe('GuardError', () => {
  it('creates a TIMEOUT error', () => {
    const err = GuardError.timeout('pii', 5000);
    expect(err.code).toBe('TIMEOUT');
    expect(err.message).toContain('pii');
    expect(err.message).toContain('5000');
  });

  it('creates an EXCEPTION error from cause', () => {
    const cause = new Error('boom');
    const err = GuardError.fromException('regex', cause);
    expect(err.code).toBe('EXCEPTION');
    expect(err.cause).toBe(cause);
  });

  it('creates a NETWORK error', () => {
    const err = GuardError.network('llm-judge', 'fetch failed');
    expect(err.code).toBe('NETWORK');
  });

  it('creates an INVALID_CONFIG error', () => {
    const err = GuardError.invalidConfig('regex', 'missing pattern');
    expect(err.code).toBe('INVALID_CONFIG');
  });

  it('extends Error', () => {
    const err = GuardError.timeout('test', 100);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('GuardError');
  });
});
