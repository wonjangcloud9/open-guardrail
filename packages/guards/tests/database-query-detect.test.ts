import { describe, it, expect } from 'vitest';
import { databaseQueryDetect } from '../src/database-query-detect.js';

const ctx = { pipelineType: 'output' as const };

describe('databaseQueryDetect', () => {
  const guard = databaseQueryDetect({ action: 'block' });

  it('allows normal text', async () => {
    const r = await guard.check('The database stores user information securely.', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('detects SELECT statement', async () => {
    const r = await guard.check('SELECT * FROM users WHERE id = 1', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects INSERT statement', async () => {
    const r = await guard.check('INSERT INTO users VALUES (1, "admin")', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects UPDATE statement', async () => {
    const r = await guard.check('UPDATE users SET role = "admin"', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects DROP statement', async () => {
    const r = await guard.check('DROP TABLE users', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects MongoDB connection string', async () => {
    const r = await guard.check('mongodb+srv://testuser:testpw@localhost/testdb', ctx);
    expect(r.passed).toBe(false);
  });

  it('respects warn action', async () => {
    const warnGuard = databaseQueryDetect({ action: 'warn' });
    const r = await warnGuard.check('SELECT name FROM users', ctx);
    expect(r.action).toBe('warn');
  });
});
