import { describe, it, expect } from 'vitest';
import { pii } from 'open-guardrail-guards';

const PII_SAMPLES = [
  'Please contact me at john.doe@example.com for details',
  'My phone number is 555-123-4567',
  'My SSN is 123-45-6789, keep it safe',
  'Pay with card 4111-1111-1111-1111',
  'Email support@company.org or call +1-800-555-0199',
  'SSN: 987-65-4321 is on file',
  'Reach me at alice_smith@gmail.com or 212-555-0147',
  'Credit card: 5500 0000 0000 0004 exp 12/26',
  'My number is (415) 555-2671 and email is bob@test.io',
  'Send invoice to billing@acme.co, SSN 111-22-3333',
  'Card number 4242 4242 4242 4242 was charged',
  'Contact: user123@domain.com, phone 310-555-8899',
  'SSN 999-88-7777 belongs to the applicant',
  'Emergency contact: +44 20 7946 0958',
  'Please verify card 6011 0000 0000 0004',
  'Hire date docs include SSN 222-33-4444',
  'Forward to ceo@bigcorp.com ASAP',
  'Call me at 1-888-555-0123 anytime',
  'Credit card on file: 3782 822463 10005',
  'Reach the team at hello@startup.dev or 650-555-1234',
];

const CLEAN_SAMPLES = [
  'The meeting is scheduled for 3 PM tomorrow',
  'Please review the quarterly report by Friday',
  'The project deadline has been moved to next week',
  'Can you help me with the database migration?',
  'The new feature should improve performance by 20%',
  'Let us discuss the architecture at the standup',
  'The test coverage increased from 75% to 85%',
  'We need to update the dependencies this sprint',
  'The API response time is averaging 200ms',
  'Consider using a caching layer for read-heavy ops',
  'The deployment pipeline needs a staging step',
  'Version 2.0 will include breaking changes',
  'The bug was caused by a race condition',
  'We should add rate limiting to the endpoint',
  'The documentation needs examples for each method',
  'Refactor the authentication module for clarity',
  'The load balancer distributes traffic evenly',
  'Monitoring alerts should go to the on-call channel',
  'The sprint retrospective is on Thursday afternoon',
  'Use environment variables for configuration values',
];

describe('PII Detection Benchmark', () => {
  const guard = pii({
    entities: ['email', 'phone', 'ssn', 'credit-card'],
    action: 'block',
  });

  describe('PII Detection (True Positive Rate)', () => {
    for (const [i, sample] of PII_SAMPLES.entries()) {
      it(`detects PII #${i + 1}`, async () => {
        const r = await guard.check(sample, { pipelineType: 'input' });
        expect(r.passed).toBe(false);
      });
    }
  });

  describe('Clean Input (True Negative Rate)', () => {
    for (const [i, sample] of CLEAN_SAMPLES.entries()) {
      it(`passes clean #${i + 1}`, async () => {
        const r = await guard.check(sample, { pipelineType: 'input' });
        expect(r.passed).toBe(true);
      });
    }
  });

  it('summary: PII detection rate >= 90%', async () => {
    let detected = 0;
    for (const sample of PII_SAMPLES) {
      const r = await guard.check(sample, { pipelineType: 'input' });
      if (!r.passed) detected++;
    }
    const rate = detected / PII_SAMPLES.length;
    console.log(
      `PII detection rate: ${(rate * 100).toFixed(1)}% (${detected}/${PII_SAMPLES.length})`,
    );
    expect(rate).toBeGreaterThanOrEqual(0.9);
  });

  it('summary: false positive rate <= 10%', async () => {
    let falsePositives = 0;
    for (const sample of CLEAN_SAMPLES) {
      const r = await guard.check(sample, { pipelineType: 'input' });
      if (!r.passed) falsePositives++;
    }
    const rate = falsePositives / CLEAN_SAMPLES.length;
    console.log(
      `False positive rate: ${(rate * 100).toFixed(1)}% (${falsePositives}/${CLEAN_SAMPLES.length})`,
    );
    expect(rate).toBeLessThanOrEqual(0.1);
  });
});
