import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type PiiCaEntity = 'sin' | 'health-card' | 'driver-license-ca' | 'phone-ca' | 'postal-ca';

interface PiiCaOptions { entities: PiiCaEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiCaMatch { type: PiiCaEntity; value: string; start: number; end: number; }

const PATTERNS: Record<PiiCaEntity, RegExp> = {
  sin: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g,
  'health-card': /\b\d{4}[-\s]?\d{3}[-\s]?\d{3}\b/g,
  'driver-license-ca': /\b[A-Z]\d{4}[-\s]?\d{5}[-\s]?\d{5}\b/g,
  'phone-ca': /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  'postal-ca': /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/g,
};

const MASK_LABELS: Record<PiiCaEntity, string> = {
  sin: '[SIN]', 'health-card': '[Health Card]', 'driver-license-ca': '[Driver License]',
  'phone-ca': '[Phone]', 'postal-ca': '[Postal Code]',
};

function detect(text: string, entities: PiiCaEntity[]): PiiCaMatch[] {
  const matches: PiiCaMatch[] = [];
  for (const e of entities) {
    const re = new RegExp(PATTERNS[e].source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) matches.push({ type: e, value: m[0], start: m.index, end: m.index + m[0].length });
  }
  return matches.sort((a, b) => b.start - a.start);
}

function mask(text: string, matches: PiiCaMatch[]): string {
  let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK_LABELS[m.type] + r.slice(m.end); return r;
}

export function piiCa(options: PiiCaOptions): Guard {
  return {
    name: 'pii-ca', version: '0.1.0', description: 'Canadian PII (SIN, health card, driver license, postal)',
    category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, options.entities);
      const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-ca', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') return { guardName: 'pii-ca', passed: true, action: 'override', overrideText: mask(text, matches), latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
      return { guardName: 'pii-ca', passed: false, action: options.action, message: `Canadian PII: ${[...new Set(matches.map((m) => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
