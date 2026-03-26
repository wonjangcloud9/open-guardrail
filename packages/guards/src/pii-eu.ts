import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type PiiEuEntity =
  | 'iban'
  | 'vat'
  | 'nino-uk'
  | 'bsn-nl'
  | 'nif-es'
  | 'ssn-it'
  | 'pesel-pl'
  | 'passport-eu';

interface PiiEuOptions {
  entities: PiiEuEntity[];
  action: 'block' | 'warn' | 'mask';
}

interface PiiEuMatch {
  type: PiiEuEntity;
  value: string;
  start: number;
  end: number;
}

const PATTERNS: Record<PiiEuEntity, RegExp> = {
  iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
  vat: /\b(?:ATU\d{8}|BE\d{10}|DE\d{9}|DK\d{8}|ES[A-Z]\d{7}[A-Z]|FI\d{8}|FR[A-Z0-9]{2}\d{9}|GB\d{9}|GR\d{9}|IE\d{7}[A-Z]{1,2}|IT\d{11}|LU\d{8}|NL\d{9}B\d{2}|PL\d{10}|PT\d{9}|SE\d{12})\b/g,
  'nino-uk': /\b[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b/g,
  'bsn-nl': /\b\d{9}\b/g,
  'nif-es': /\b\d{8}[A-Z]\b/g,
  'ssn-it': /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/g,
  'pesel-pl': /\b\d{11}\b/g,
  'passport-eu': /\b[A-Z]{2}\d{7}\b/g,
};

const MASK_LABELS: Record<PiiEuEntity, string> = {
  iban: '[IBAN]',
  vat: '[VAT_NUMBER]',
  'nino-uk': '[NINO]',
  'bsn-nl': '[BSN]',
  'nif-es': '[NIF]',
  'ssn-it': '[CODICE_FISCALE]',
  'pesel-pl': '[PESEL]',
  'passport-eu': '[EU_PASSPORT]',
};

function detect(text: string, entities: PiiEuEntity[]): PiiEuMatch[] {
  const matches: PiiEuMatch[] = [];
  for (const entity of entities) {
    const re = new RegExp(PATTERNS[entity].source, PATTERNS[entity].flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ type: entity, value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskText(text: string, matches: PiiEuMatch[]): string {
  let result = text;
  for (const m of matches) {
    result = result.slice(0, m.start) + MASK_LABELS[m.type] + result.slice(m.end);
  }
  return result;
}

export function piiEu(options: PiiEuOptions): Guard {
  return {
    name: 'pii-eu',
    version: '0.1.0',
    description: 'European PII detection (IBAN, VAT, NINO, BSN, NIF, Codice Fiscale, PESEL)',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, options.entities);
      const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-eu', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') {
        return { guardName: 'pii-eu', passed: true, action: 'override', overrideText: maskText(text, matches), latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
      }
      return { guardName: 'pii-eu', passed: false, action: options.action, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
