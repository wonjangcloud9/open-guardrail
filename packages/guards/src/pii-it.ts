import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type PiiItEntity = 'codice-fiscale' | 'partita-iva' | 'phone-it' | 'iban-it';
interface PiiItOptions { entities: PiiItEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiItMatch { type: PiiItEntity; value: string; start: number; end: number; }

const PATTERNS: Record<PiiItEntity, RegExp> = {
  'codice-fiscale': /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/g,
  'partita-iva': /\b\d{11}\b/g,
  'phone-it': /\b(?:\+?39[-.\s]?)?0?\d{2,4}[-.\s]?\d{4,8}\b/g,
  'iban-it': /\bIT\d{2}\s?[A-Z]\d{3}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{3}\b/g,
};
const MASK: Record<PiiItEntity, string> = { 'codice-fiscale': '[Codice Fiscale]', 'partita-iva': '[Partita IVA]', 'phone-it': '[Telefono]', 'iban-it': '[IBAN]' };

function detect(text: string, entities: PiiItEntity[]): PiiItMatch[] {
  const m: PiiItMatch[] = [];
  for (const e of entities) { const re = new RegExp(PATTERNS[e].source, 'g'); let x; while ((x = re.exec(text))) m.push({ type: e, value: x[0], start: x.index, end: x.index + x[0].length }); }
  return m.sort((a, b) => b.start - a.start);
}

export function piiIt(options: PiiItOptions): Guard {
  return { name: 'pii-it', version: '0.1.0', description: 'Italian PII (Codice Fiscale, Partita IVA, phone, IBAN)', category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matches = detect(text, options.entities); const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-it', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') { let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK[m.type] + r.slice(m.end); return { guardName: 'pii-it', passed: true, action: 'override', overrideText: r, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type }) => ({ type })) } }; }
      return { guardName: 'pii-it', passed: false, action: options.action, message: `Italian PII: ${[...new Set(matches.map(m => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
