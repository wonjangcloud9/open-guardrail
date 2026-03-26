import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type PiiThEntity =
  | 'national-id'
  | 'passport'
  | 'phone'
  | 'bank-account';

interface PiiThOptions {
  entities: PiiThEntity[];
  action: 'block' | 'warn' | 'mask';
}

interface PiiThMatch {
  type: PiiThEntity;
  value: string;
  start: number;
  end: number;
}

const PATTERNS: Record<PiiThEntity, RegExp> = {
  'national-id': /\b\d{1}-\d{4}-\d{5}-\d{2}-\d{1}\b/g,
  passport: /\b[A-Z]{1,2}\d{6,7}\b/g,
  phone: /\b(?:\+?66[-.\s]?)?0?\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g,
  'bank-account': /\b\d{3}-\d{1}-\d{5}-\d{1}\b/g,
};

const MASK_LABELS: Record<PiiThEntity, string> = {
  'national-id': '[เลขบัตรประชาชน]',
  passport: '[หมายเลขหนังสือเดินทาง]',
  phone: '[เบอร์โทรศัพท์]',
  'bank-account': '[เลขบัญชีธนาคาร]',
};

function validateNationalId(raw: string): boolean {
  const digits = raw.replace(/-/g, '');
  if (digits.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  return check === Number(digits[12]);
}

function detect(text: string, entities: PiiThEntity[]): PiiThMatch[] {
  const matches: PiiThMatch[] = [];
  for (const entity of entities) {
    const re = new RegExp(PATTERNS[entity].source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (entity === 'national-id' && !validateNationalId(m[0])) continue;
      matches.push({ type: entity, value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskText(text: string, matches: PiiThMatch[]): string {
  let result = text;
  for (const m of matches) {
    result = result.slice(0, m.start) + MASK_LABELS[m.type] + result.slice(m.end);
  }
  return result;
}

export function piiTh(options: PiiThOptions): Guard {
  return {
    name: 'pii-th',
    version: '0.1.0',
    description: 'Thai PII detection and masking',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, options.entities);
      const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-th', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') {
        return { guardName: 'pii-th', passed: true, action: 'override', overrideText: maskText(text, matches), latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
      }
      return { guardName: 'pii-th', passed: false, action: options.action, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
