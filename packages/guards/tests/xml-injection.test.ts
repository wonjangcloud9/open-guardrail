import { describe, it, expect } from 'vitest';
import { xmlInjection } from '../src/xml-injection.js';

describe('xml-injection guard', () => {
  it('detects DOCTYPE ENTITY (XXE)', async () => {
    const guard = xmlInjection({ action: 'block' });
    const result = await guard.check('<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects ENTITY declaration', async () => {
    const guard = xmlInjection({ action: 'block' });
    const result = await guard.check('<!ENTITY test "value">', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects CDATA injection', async () => {
    const guard = xmlInjection({ action: 'block' });
    const result = await guard.check('<![CDATA[<script>alert(1)</script>]]>', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects SYSTEM file:// reference', async () => {
    const guard = xmlInjection({ action: 'warn' });
    const result = await guard.check('SYSTEM "file:///etc/shadow"', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects billion laughs pattern', async () => {
    const guard = xmlInjection({ action: 'block' });
    const result = await guard.check('<!DOCTYPE lolz [<!ENTITY lol "lol">]>', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal XML content', async () => {
    const guard = xmlInjection({ action: 'block' });
    const result = await guard.check('<user><name>John</name></user>', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('allows plain text', async () => {
    const guard = xmlInjection({ action: 'block' });
    const result = await guard.check('Please parse this XML file for me', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });
});
