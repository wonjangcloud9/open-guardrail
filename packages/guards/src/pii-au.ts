import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type PiiAuEntity = 'tfn' | 'medicare-au' | 'abn' | 'passport-au' | 'phone-au';

interface PiiAuOptions { entities: PiiAuEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiAuMatch { type: PiiAuEntity; value: string; start: number; end: number; }

const PATTERNS: Record<PiiAuEntity, RegExp> = {
  tfn: /\b\d{3}\s?\d{3}\s?\d{3}\b/g,
  'medicare-au': /\b\d{4}\s?\d{5}\s?\d{1}\b/g,
  abn: /\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b/g,
  'passport-au': /\b[A-Z]{1,2}\d{7}\b/g,
  'phone-au': /\b(?:\+?61|0)\s?\d\s?\d{4}\s?\d{4}\b/g,
};

const MASK_LABELS: Record<PiiAuEntity, string> = {
  tfn: '[TFN]', 'medicare-au': '[Medicare]', abn: '[ABN]',
  'passport-au': '[Passport]', 'phone-au': '[Phone]',
};

function detect(text: string, entities: PiiAuEntity[]): PiiAuMatch[] {
  const matches: PiiAuMatch[] = [];
  for (const entity of entities) {
    const re = new RegExp(PATTERNS[entity].source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ type: entity, value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function mask(text: string, matches: PiiAuMatch[]): string {
  let r = text;
  for (const m of matches) { r = r.slice(0, m.start) + MASK_LABELS[m.type] + r.slice(m.end); }
  return r;
}

export function piiAu(options: PiiAuOptions): Guard {
  return {
    name: 'pii-au', version: '0.1.0',
    description: 'Australian PII detection (TFN, Medicare, ABN, passport, phone)',
    category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, options.entities);
      const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-au', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') {
        return { guardName: 'pii-au', passed: true, action: 'override', overrideText: mask(text, matches), latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
      }
      return { guardName: 'pii-au', passed: false, action: options.action, message: `Australian PII: ${[...new Set(matches.map((m) => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
