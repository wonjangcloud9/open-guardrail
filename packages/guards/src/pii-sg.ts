import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type PiiSgEntity = 'nric' | 'fin' | 'phone-sg' | 'postal-sg';
interface PiiSgOptions { entities: PiiSgEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiSgMatch { type: PiiSgEntity; value: string; start: number; end: number; }

const PATTERNS: Record<PiiSgEntity, RegExp> = {
  nric: /\b[STFG]\d{7}[A-Z]\b/g,
  fin: /\b[FGMN]\d{7}[A-Z]\b/g,
  'phone-sg': /\b(?:\+?65[-.\s]?)?[689]\d{3}[-.\s]?\d{4}\b/g,
  'postal-sg': /\b\d{6}\b/g,
};
const MASK: Record<PiiSgEntity, string> = { nric: '[NRIC]', fin: '[FIN]', 'phone-sg': '[Phone]', 'postal-sg': '[Postal]' };

function detect(text: string, entities: PiiSgEntity[]): PiiSgMatch[] {
  const m: PiiSgMatch[] = [];
  for (const e of entities) { const re = new RegExp(PATTERNS[e].source, 'g'); let x; while ((x = re.exec(text))) m.push({ type: e, value: x[0], start: x.index, end: x.index + x[0].length }); }
  return m.sort((a, b) => b.start - a.start);
}

export function piiSg(options: PiiSgOptions): Guard {
  return { name: 'pii-sg', version: '0.1.0', description: 'Singapore PII (NRIC, FIN, phone, postal)', category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matches = detect(text, options.entities); const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-sg', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') { let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK[m.type] + r.slice(m.end); return { guardName: 'pii-sg', passed: true, action: 'override', overrideText: r, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type }) => ({ type })) } }; }
      return { guardName: 'pii-sg', passed: false, action: options.action, message: `Singapore PII: ${[...new Set(matches.map(m => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
