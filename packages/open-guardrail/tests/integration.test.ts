import { describe, it, expect } from 'vitest';
import {
  // Core
  pipe, createPipeline,
  Pipeline, EventBus, GuardRegistry, OpenGuardrail, GuardError,
  StreamingPipeline, AuditLogger, GuardRouter, createRouter,
  // Security guards
  regex, keyword, promptInjection,
  // Privacy guards
  pii,
  // Content guards
  toxicity, topicDeny, topicAllow, bias, language,
  // Format guards
  wordCount, schemaGuard,
  // AI Delegation guards
  llmJudge, hallucination, relevance, groundedness,
  // Operational guards
  costGuard, rateLimit, dataLeakage, sentiment,
  // Korea guards
  piiKr, profanityKr, residentId, creditInfo, ismsP, pipa,
  // Agent Safety
  toolCallValidator,
} from '../src/index.js';

describe('Umbrella package exports', () => {
  it('exports all core classes', () => {
    expect(Pipeline).toBeDefined();
    expect(EventBus).toBeDefined();
    expect(GuardRegistry).toBeDefined();
    expect(OpenGuardrail).toBeDefined();
    expect(GuardError).toBeDefined();
  });

  it('exports pipe and createPipeline', () => {
    expect(typeof pipe).toBe('function');
    expect(typeof createPipeline).toBe('function');
  });

  it('exports all 26 guard factories', () => {
    const guards = [
      regex, keyword, promptInjection,
      pii,
      toxicity, topicDeny, topicAllow, bias, language,
      wordCount, schemaGuard,
      llmJudge, hallucination, relevance, groundedness,
      costGuard, rateLimit, dataLeakage, sentiment,
      piiKr, profanityKr, residentId, creditInfo, ismsP, pipa,
      toolCallValidator,
    ];
    for (const guard of guards) {
      expect(typeof guard).toBe('function');
    }
    expect(guards).toHaveLength(26);
  });
});

describe('End-to-end pipeline', () => {
  it('pipe() with keyword guard blocks bad input', async () => {
    const p = pipe(
      keyword({ denied: ['bad'], action: 'block' }),
    );
    const safe = await p.run('hello');
    expect(safe.passed).toBe(true);

    const blocked = await p.run('this is bad');
    expect(blocked.passed).toBe(false);
    expect(blocked.action).toBe('block');
  });

  it('PII masking through pipe', async () => {
    const p = pipe(
      pii({ entities: ['email'], action: 'mask' }),
    );
    const result = await p.run('email: user@test.com');
    expect(result.passed).toBe(true);
    expect(result.output).toContain('[EMAIL]');
  });

  it('multiple guards in pipeline', async () => {
    const p = pipe(
      promptInjection({ action: 'block' }),
      keyword({ denied: ['hack'], action: 'block' }),
    );
    const result = await p.run('hello world');
    expect(result.passed).toBe(true);
    expect(result.results).toHaveLength(2);
  });
});

describe('Phase 3 exports', () => {
  it('exports StreamingPipeline', () => {
    expect(StreamingPipeline).toBeDefined();
  });

  it('exports AuditLogger', () => {
    expect(AuditLogger).toBeDefined();
    const logger = new AuditLogger();
    expect(typeof logger.record).toBe('function');
  });

  it('exports GuardRouter + createRouter', () => {
    expect(GuardRouter).toBeDefined();
    expect(typeof createRouter).toBe('function');
  });

  it('exports toolCallValidator', () => {
    expect(typeof toolCallValidator).toBe('function');
  });
});
