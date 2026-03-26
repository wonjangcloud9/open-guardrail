import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type PiiTrEntity = 'tc-kimlik' | 'vergi' | 'phone-tr';
interface PiiTrOptions { entities: PiiTrEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiTrMatch { type: PiiTrEntity; value: string; start: number; end: number; }

const PATTERNS: Record<PiiTrEntity, RegExp> = {
  'tc-kimlik': /\b[1-9]\d{10}\b/g,
  vergi: /\b\d{10}\b/g,
  'phone-tr': /\b(?:\+?90[-.\s]?)?0?5\d{2}[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}\b/g,
};
const MASK: Record<PiiTrEntity, string> = { 'tc-kimlik': '[TC Kimlik]', vergi: '[Vergi No]', 'phone-tr': '[Telefon]' };

function detect(text: string, entities: PiiTrEntity[]): PiiTrMatch[] {
  const m: PiiTrMatch[] = [];
  for (const e of entities) { const re = new RegExp(PATTERNS[e].source, 'g'); let x; while ((x = re.exec(text))) m.push({ type: e, value: x[0], start: x.index, end: x.index + x[0].length }); }
  return m.sort((a, b) => b.start - a.start);
}

export function piiTr(options: PiiTrOptions): Guard {
  return { name: 'pii-tr', version: '0.1.0', description: 'Turkish PII (TC Kimlik, Vergi, phone)', category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matches = detect(text, options.entities); const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-tr', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') { let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK[m.type] + r.slice(m.end); return { guardName: 'pii-tr', passed: true, action: 'override', overrideText: r, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type }) => ({ type })) } }; }
      return { guardName: 'pii-tr', passed: false, action: options.action, message: `Turkish PII: ${[...new Set(matches.map(m => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
