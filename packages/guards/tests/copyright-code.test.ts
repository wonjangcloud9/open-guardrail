import { describe, it, expect } from 'vitest';
import { copyrightCode } from '../src/copyright-code.js';
const ctx = { pipelineType: 'output' as const };
describe('copyright-code', () => {
  it('detects GPL license', async () => {
    const g = copyrightCode({ action: 'block' });
    expect((await g.check('GNU General Public License v3', ctx)).passed).toBe(false);
  });
  it('detects copyright notice', async () => {
    const g = copyrightCode({ action: 'warn' });
    const r = await g.check('Copyright (c) 2024 Acme Corp', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('detects all rights reserved', async () => {
    const g = copyrightCode({ action: 'block' });
    expect((await g.check('All rights reserved.', ctx)).passed).toBe(false);
  });
  it('allows code without licenses', async () => {
    const g = copyrightCode({ action: 'block' });
    expect((await g.check('function add(a, b) { return a + b; }', ctx)).passed).toBe(true);
  });
  it('respects allowedLicenses', async () => {
    const g = copyrightCode({ action: 'block', allowedLicenses: ['mit'] });
    expect((await g.check('MIT License', ctx)).passed).toBe(true);
    expect((await g.check('GNU General Public License v3', ctx)).passed).toBe(false);
  });
  it('detects proprietary markers', async () => {
    const g = copyrightCode({ action: 'block' });
    expect((await g.check('PROPRIETARY AND CONFIDENTIAL', ctx)).passed).toBe(false);
  });
});
