import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type PiiDeEntity = 'steuer-id' | 'personalausweis' | 'reisepass' | 'iban-de' | 'phone-de';

interface PiiDeOptions {
  entities: PiiDeEntity[];
  action: 'block' | 'warn' | 'mask';
}

interface PiiDeMatch { type: PiiDeEntity; value: string; start: number; end: number; }

const PATTERNS: Record<PiiDeEntity, RegExp> = {
  'steuer-id': /\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b/g,
  personalausweis: /\b[CFGHJKLMNPRTVWXYZ]\d{8}\b/g,
  reisepass: /\b[CFGHJKLMNPRTVWXYZ]\d{8}\b/g,
  'iban-de': /\bDE\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/g,
  'phone-de': /(?:\+49|0049)\s?\d{2,5}[-/\s]?\d{3,9}/g,
};

const MASK_LABELS: Record<PiiDeEntity, string> = {
  'steuer-id': '[Steuer-ID]',
  personalausweis: '[Personalausweis]',
  reisepass: '[Reisepass]',
  'iban-de': '[IBAN]',
  'phone-de': '[Telefonnummer]',
};

function detect(text: string, entities: PiiDeEntity[]): PiiDeMatch[] {
  const matches: PiiDeMatch[] = [];
  for (const entity of entities) {
    const re = new RegExp(PATTERNS[entity].source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ type: entity, value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function mask(text: string, matches: PiiDeMatch[]): string {
  let r = text;
  for (const m of matches) { r = r.slice(0, m.start) + MASK_LABELS[m.type] + r.slice(m.end); }
  return r;
}

export function piiDe(options: PiiDeOptions): Guard {
  return {
    name: 'pii-de', version: '0.1.0',
    description: 'German PII detection (Steuer-ID, Personalausweis, IBAN, phone)',
    category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, options.entities);
      const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-de', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') {
        return { guardName: 'pii-de', passed: true, action: 'override', overrideText: mask(text, matches), latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
      }
      return { guardName: 'pii-de', passed: false, action: options.action, message: `German PII detected: ${[...new Set(matches.map((m) => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
