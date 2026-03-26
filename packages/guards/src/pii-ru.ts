import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type PiiRuEntity = 'inn' | 'snils' | 'passport-ru' | 'phone-ru';
interface PiiRuOptions { entities: PiiRuEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiRuMatch { type: PiiRuEntity; value: string; start: number; end: number; }

const PATTERNS: Record<PiiRuEntity, RegExp> = {
  inn: /\b\d{10,12}\b/g,
  snils: /\b\d{3}-\d{3}-\d{3}\s?\d{2}\b/g,
  'passport-ru': /\b\d{2}\s?\d{2}\s?\d{6}\b/g,
  'phone-ru': /\b(?:\+?7|8)[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}\b/g,
};
const MASK: Record<PiiRuEntity, string> = { inn: '[ИНН]', snils: '[СНИЛС]', 'passport-ru': '[Паспорт]', 'phone-ru': '[Телефон]' };

function detect(text: string, entities: PiiRuEntity[]): PiiRuMatch[] {
  const m: PiiRuMatch[] = [];
  for (const e of entities) { const re = new RegExp(PATTERNS[e].source, 'g'); let x; while ((x = re.exec(text))) m.push({ type: e, value: x[0], start: x.index, end: x.index + x[0].length }); }
  return m.sort((a, b) => b.start - a.start);
}

export function piiRu(options: PiiRuOptions): Guard {
  return { name: 'pii-ru', version: '0.1.0', description: 'Russian PII (INN, SNILS, passport, phone)', category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matches = detect(text, options.entities); const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-ru', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') { let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK[m.type] + r.slice(m.end); return { guardName: 'pii-ru', passed: true, action: 'override', overrideText: r, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type }) => ({ type })) } }; }
      return { guardName: 'pii-ru', passed: false, action: options.action, message: `Russian PII: ${[...new Set(matches.map(m => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
