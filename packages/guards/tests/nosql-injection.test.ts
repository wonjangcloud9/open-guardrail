import { describe, it, expect } from 'vitest';
import { nosqlInjection } from '../src/nosql-injection.js';

describe('nosql-injection guard', () => {
  it('detects $gt operator', async () => {
    const guard = nosqlInjection({ action: 'block' });
    const result = await guard.check('{"age": {"$gt": ""}}', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects $ne operator', async () => {
    const guard = nosqlInjection({ action: 'block' });
    const result = await guard.check('{"password": {"$ne": ""}}', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects $where operator', async () => {
    const guard = nosqlInjection({ action: 'block' });
    const result = await guard.check('$where: "this.password == x"', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects db.collection.find()', async () => {
    const guard = nosqlInjection({ action: 'warn' });
    const result = await guard.check('db.users.find({admin: true})', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects JSON $-operator', async () => {
    const guard = nosqlInjection({ action: 'block' });
    const result = await guard.check('{ "$regex": ".*" }', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal queries', async () => {
    const guard = nosqlInjection({ action: 'block' });
    const result = await guard.check('Find all users with name John', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects mapReduce call', async () => {
    const guard = nosqlInjection({ action: 'block' });
    const result = await guard.check('mapReduce(function() { emit(this.a) })', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });
});
