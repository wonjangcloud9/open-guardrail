import { describe, it, expect } from 'vitest';
import { ldapInjection } from '../src/ldap-injection.js';

describe('ldap-injection guard', () => {
  it('detects )(&  pattern', async () => {
    const guard = ldapInjection({ action: 'block' });
    const result = await guard.check('user=admin)(&(password=*))', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects )(| pattern', async () => {
    const guard = ldapInjection({ action: 'block' });
    const result = await guard.check('cn=*)(|(cn=*))', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects *)( pattern', async () => {
    const guard = ldapInjection({ action: 'block' });
    const result = await guard.check('uid=*)(uid=*)', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects escaped special chars', async () => {
    const guard = ldapInjection({ action: 'warn' });
    const result = await guard.check('input with \\28 and \\29 sequences', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects wildcard filter', async () => {
    const guard = ldapInjection({ action: 'block' });
    const result = await guard.check('(uid=*)', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = ldapInjection({ action: 'block' });
    const result = await guard.check('Search for user John in directory', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });
});
