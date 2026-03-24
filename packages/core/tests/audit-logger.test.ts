import { describe, it, expect } from 'vitest';
import { AuditLogger } from '../src/audit-logger.js';

describe('AuditLogger', () => {
  it('records guard:after events', () => {
    const logger = new AuditLogger();
    logger.record({
      event: 'guard:after',
      guardName: 'pii',
      action: 'allow',
      passed: true,
      inputPreview: 'hello world',
    });
    expect(logger.entries).toHaveLength(1);
    expect(logger.entries[0].guardName).toBe('pii');
  });

  it('records guard:blocked events', () => {
    const logger = new AuditLogger();
    logger.record({
      event: 'guard:blocked',
      guardName: 'keyword',
      action: 'block',
      passed: false,
      inputPreview: 'bad word...',
    });
    expect(logger.entries[0].action).toBe('block');
  });

  it('exports entries as JSON', () => {
    const logger = new AuditLogger();
    logger.record({ event: 'guard:after', guardName: 'pii', action: 'allow', passed: true, inputPreview: 'hi' });
    const json = logger.exportJSON();
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
  });

  it('filters by date range', () => {
    const logger = new AuditLogger();
    logger.record({ event: 'guard:after', guardName: 'a', action: 'allow', passed: true, inputPreview: '' });
    const entries = logger.query({ from: new Date(Date.now() - 60000) });
    expect(entries).toHaveLength(1);
  });

  it('filters by guard name', () => {
    const logger = new AuditLogger();
    logger.record({ event: 'guard:after', guardName: 'pii', action: 'allow', passed: true, inputPreview: '' });
    logger.record({ event: 'guard:blocked', guardName: 'keyword', action: 'block', passed: false, inputPreview: '' });
    const entries = logger.query({ guardName: 'keyword' });
    expect(entries).toHaveLength(1);
  });

  it('truncates input preview', () => {
    const logger = new AuditLogger({ maxPreviewLength: 10 });
    logger.record({ event: 'guard:after', guardName: 'a', action: 'allow', passed: true, inputPreview: 'a'.repeat(100) });
    expect(logger.entries[0].inputPreview.length).toBeLessThanOrEqual(13);
  });

  it('creates EventBus handler', async () => {
    const logger = new AuditLogger();
    const handler = logger.createHandler();
    await handler({ guardName: 'pii', text: 'test input', result: { passed: true, action: 'allow' } });
    expect(logger.entries).toHaveLength(1);
  });

  it('clears entries', () => {
    const logger = new AuditLogger();
    logger.record({ event: 'guard:after', guardName: 'a', action: 'allow', passed: true, inputPreview: '' });
    logger.clear();
    expect(logger.entries).toHaveLength(0);
  });
});
