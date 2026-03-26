import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type PiiEsEntity = 'dni' | 'nie' | 'cif' | 'phone-es' | 'iban-es';
interface PiiEsOptions { entities: PiiEsEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiEsMatch { type: PiiEsEntity; value: string; start: number; end: number; }

const PATTERNS: Record<PiiEsEntity, RegExp> = {
  dni: /\b\d{8}[A-Z]\b/g,
  nie: /\b[XYZ]\d{7}[A-Z]\b/g,
  cif: /\b[ABCDEFGHJNPQRSUVW]\d{7}[A-J0-9]\b/g,
  'phone-es': /\b(?:\+?34[-.\s]?)?[6-9]\d{2}[-.\s]?\d{3}[-.\s]?\d{3}\b/g,
  'iban-es': /\bES\d{2}\s?\d{4}\s?\d{4}\s?\d{2}\s?\d{10}\b/g,
};
const MASK: Record<PiiEsEntity, string> = { dni: '[DNI]', nie: '[NIE]', cif: '[CIF]', 'phone-es': '[Telefono]', 'iban-es': '[IBAN]' };

function detect(text: string, entities: PiiEsEntity[]): PiiEsMatch[] {
  const m: PiiEsMatch[] = [];
  for (const e of entities) { const re = new RegExp(PATTERNS[e].source, 'g'); let x; while ((x = re.exec(text))) m.push({ type: e, value: x[0], start: x.index, end: x.index + x[0].length }); }
  return m.sort((a, b) => b.start - a.start);
}

export function piiEs(options: PiiEsOptions): Guard {
  return { name: 'pii-es', version: '0.1.0', description: 'Spanish PII (DNI, NIE, CIF, phone, IBAN)', category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matches = detect(text, options.entities); const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-es', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') { let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK[m.type] + r.slice(m.end); return { guardName: 'pii-es', passed: true, action: 'override', overrideText: r, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type }) => ({ type })) } }; }
      return { guardName: 'pii-es', passed: false, action: options.action, message: `Spanish PII: ${[...new Set(matches.map(m => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
