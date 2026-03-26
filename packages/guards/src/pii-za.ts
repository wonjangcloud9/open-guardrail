import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
type PiiZaEntity = 'sa-id' | 'phone-za';
interface PiiZaOptions { entities: PiiZaEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiZaMatch { type: PiiZaEntity; value: string; start: number; end: number; }
const PATTERNS: Record<PiiZaEntity, RegExp> = { 'sa-id': /\b\d{13}\b/g, 'phone-za': /\b(?:\+?27[-.\s]?)?0?\d{2}[-.\s]?\d{3}[-.\s]?\d{4}\b/g };
const MASK: Record<PiiZaEntity, string> = { 'sa-id': '[SA ID]', 'phone-za': '[Phone]' };
function detect(text: string, entities: PiiZaEntity[]): PiiZaMatch[] {
  const m: PiiZaMatch[] = []; for (const e of entities) { const re = new RegExp(PATTERNS[e].source, 'g'); let x; while ((x = re.exec(text))) m.push({ type: e, value: x[0], start: x.index, end: x.index + x[0].length }); } return m.sort((a, b) => b.start - a.start);
}
export function piiZa(options: PiiZaOptions): Guard {
  return { name: 'pii-za', version: '0.1.0', description: 'South African PII (ID number, phone)', category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matches = detect(text, options.entities); const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-za', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') { let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK[m.type] + r.slice(m.end); return { guardName: 'pii-za', passed: true, action: 'override', overrideText: r, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type }) => ({ type })) } }; }
      return { guardName: 'pii-za', passed: false, action: options.action, message: `South African PII: ${[...new Set(matches.map(m => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
