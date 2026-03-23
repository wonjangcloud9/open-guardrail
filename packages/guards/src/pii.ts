import type { Guard, GuardResult, GuardContext } from '@open-guardrail/core';

type PiiEntity = 'email' | 'phone' | 'credit-card' | 'ssn';
type PiiAction = 'block' | 'warn' | 'mask';

interface PiiOptions {
  entities: PiiEntity[];
  action: PiiAction;
}

interface PiiMatch {
  type: PiiEntity;
  value: string;
  start: number;
  end: number;
}

const PATTERNS: Record<PiiEntity, RegExp> = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/g,
  'credit-card': /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
};

const MASK_LABELS: Record<PiiEntity, string> = {
  email: '[EMAIL]',
  phone: '[PHONE]',
  'credit-card': '[CREDIT_CARD]',
  ssn: '[SSN]',
};

function detectPii(text: string, entities: PiiEntity[]): PiiMatch[] {
  const matches: PiiMatch[] = [];
  for (const entity of entities) {
    const pattern = new RegExp(PATTERNS[entity].source, 'g');
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      matches.push({ type: entity, value: match[0], start: match.index, end: match.index + match[0].length });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskText(text: string, matches: PiiMatch[]): string {
  let result = text;
  for (const m of matches) {
    result = result.slice(0, m.start) + MASK_LABELS[m.type] + result.slice(m.end);
  }
  return result;
}

export function pii(options: PiiOptions): Guard {
  return {
    name: 'pii',
    version: '0.1.0',
    description: 'PII detection and masking guard',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = detectPii(text, options.entities);
      const triggered = matches.length > 0;

      if (!triggered) {
        return { guardName: 'pii', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }

      if (options.action === 'mask') {
        return {
          guardName: 'pii', passed: true, action: 'override',
          overrideText: maskText(text, matches),
          latencyMs: Math.round(performance.now() - start),
          details: { detected: matches.map(({ type, value }) => ({ type, value })) },
        };
      }

      return {
        guardName: 'pii', passed: false, action: options.action,
        latencyMs: Math.round(performance.now() - start),
        details: { detected: matches.map(({ type, value }) => ({ type, value })) },
      };
    },
  };
}
