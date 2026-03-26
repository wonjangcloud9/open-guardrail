import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type PiiArEntity =
  | 'national-id'
  | 'passport'
  | 'phone'
  | 'iban';

interface PiiArOptions {
  entities: PiiArEntity[];
  action: 'block' | 'warn' | 'mask';
}

interface PiiArMatch {
  type: PiiArEntity;
  value: string;
  start: number;
  end: number;
}

const PATTERNS: Record<PiiArEntity, RegExp> = {
  'national-id': /\b\d{10}\b/g,
  passport: /\b[A-Z]\d{8}\b/g,
  phone: /\b(?:\+?(?:966|971|20|962|961|212|216)[-.\s]?)?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g,
  iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
};

const MASK_LABELS: Record<PiiArEntity, string> = {
  'national-id': '[رقم الهوية]',
  passport: '[رقم جواز السفر]',
  phone: '[رقم الهاتف]',
  iban: '[رقم الحساب البنكي]',
};

function detect(text: string, entities: PiiArEntity[]): PiiArMatch[] {
  const matches: PiiArMatch[] = [];
  for (const entity of entities) {
    const re = new RegExp(PATTERNS[entity].source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ type: entity, value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskText(text: string, matches: PiiArMatch[]): string {
  let result = text;
  for (const m of matches) {
    result = result.slice(0, m.start) + MASK_LABELS[m.type] + result.slice(m.end);
  }
  return result;
}

export function piiAr(options: PiiArOptions): Guard {
  return {
    name: 'pii-ar',
    version: '0.1.0',
    description: 'Arabic/Middle East PII detection and masking',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, options.entities);
      const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-ar', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') {
        return { guardName: 'pii-ar', passed: true, action: 'override', overrideText: maskText(text, matches), latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
      }
      return { guardName: 'pii-ar', passed: false, action: options.action, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
