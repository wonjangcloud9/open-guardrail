import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type PiiPlEntity = 'pesel' | 'nip' | 'regon' | 'dowod' | 'phone-pl';
interface PiiPlOptions { entities: PiiPlEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiPlMatch { type: PiiPlEntity; value: string; start: number; end: number; }

const PATTERNS: Record<PiiPlEntity, RegExp> = {
  pesel: /\b\d{11}\b/g,
  nip: /\b\d{3}-\d{3}-\d{2}-\d{2}\b/g,
  regon: /\b\d{9}(?:\d{5})?\b/g,
  dowod: /\b[A-Z]{3}\d{6}\b/g,
  'phone-pl': /\b(?:\+?48[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{3}\b/g,
};
const MASK: Record<PiiPlEntity, string> = { pesel: '[PESEL]', nip: '[NIP]', regon: '[REGON]', dowod: '[Dowod]', 'phone-pl': '[Telefon]' };

function detect(text: string, entities: PiiPlEntity[]): PiiPlMatch[] {
  const m: PiiPlMatch[] = [];
  for (const e of entities) { const re = new RegExp(PATTERNS[e].source, 'g'); let x; while ((x = re.exec(text))) m.push({ type: e, value: x[0], start: x.index, end: x.index + x[0].length }); }
  return m.sort((a, b) => b.start - a.start);
}

export function piiPl(options: PiiPlOptions): Guard {
  return { name: 'pii-pl', version: '0.1.0', description: 'Polish PII (PESEL, NIP, REGON, dowod, phone)', category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matches = detect(text, options.entities); const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-pl', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') { let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK[m.type] + r.slice(m.end); return { guardName: 'pii-pl', passed: true, action: 'override', overrideText: r, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type }) => ({ type })) } }; }
      return { guardName: 'pii-pl', passed: false, action: options.action, message: `Polish PII: ${[...new Set(matches.map(m => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
