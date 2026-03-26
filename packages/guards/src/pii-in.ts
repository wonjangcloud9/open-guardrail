import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type PiiInEntity =
  | 'aadhaar'
  | 'pan'
  | 'passport'
  | 'phone'
  | 'ifsc';

interface PiiInOptions {
  entities: PiiInEntity[];
  action: 'block' | 'warn' | 'mask';
}

interface PiiInMatch {
  type: PiiInEntity;
  value: string;
  start: number;
  end: number;
}

const PATTERNS: Record<PiiInEntity, RegExp> = {
  aadhaar: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
  pan: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
  passport: /\b[A-Z]\d{7}\b/g,
  phone: /\b(?:\+?91[-.\s]?)?[6-9]\d{9}\b/g,
  ifsc: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
};

const MASK_LABELS: Record<PiiInEntity, string> = {
  aadhaar: '[आधार नंबर]',
  pan: '[पैन नंबर]',
  passport: '[पासपोर्ट नंबर]',
  phone: '[फ़ोन नंबर]',
  ifsc: '[IFSC कोड]',
};

const AADHAAR_WEIGHTS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function validateAadhaar(raw: string): boolean {
  const digits = raw.replace(/\s/g, '');
  if (digits.length !== 12) return false;
  if (digits[0] === '0' || digits[0] === '1') return false;
  return true;
}

function detect(text: string, entities: PiiInEntity[]): PiiInMatch[] {
  const matches: PiiInMatch[] = [];
  for (const entity of entities) {
    const re = new RegExp(PATTERNS[entity].source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (entity === 'aadhaar' && !validateAadhaar(m[0])) continue;
      matches.push({ type: entity, value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskText(text: string, matches: PiiInMatch[]): string {
  let result = text;
  for (const m of matches) {
    result = result.slice(0, m.start) + MASK_LABELS[m.type] + result.slice(m.end);
  }
  return result;
}

export function piiIn(options: PiiInOptions): Guard {
  return {
    name: 'pii-in',
    version: '0.1.0',
    description: 'Indian PII detection and masking (Aadhaar, PAN, IFSC)',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, options.entities);
      const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-in', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') {
        return { guardName: 'pii-in', passed: true, action: 'override', overrideText: maskText(text, matches), latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
      }
      return { guardName: 'pii-in', passed: false, action: options.action, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
