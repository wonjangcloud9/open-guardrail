import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
type PiiKeEntity = 'national-id-ke' | 'kra-pin' | 'phone-ke';
interface PiiKeOptions { entities: PiiKeEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiKeMatch { type: PiiKeEntity; value: string; start: number; end: number; }
const PATTERNS: Record<PiiKeEntity, RegExp> = { 'national-id-ke': /\b\d{8}\b/g, 'kra-pin': /\b[AP]\d{9}[A-Z]\b/g, 'phone-ke': /\b(?:\+?254[-.\s]?)?0?\d{2}[-.\s]?\d{3}[-.\s]?\d{3,4}\b/g };
const MASK: Record<PiiKeEntity, string> = { 'national-id-ke': '[National ID]', 'kra-pin': '[KRA PIN]', 'phone-ke': '[Phone]' };
function detect(text: string, entities: PiiKeEntity[]): PiiKeMatch[] { const m: PiiKeMatch[] = []; for (const e of entities) { const re = new RegExp(PATTERNS[e].source, 'g'); let x; while ((x = re.exec(text))) m.push({ type: e, value: x[0], start: x.index, end: x.index + x[0].length }); } return m.sort((a, b) => b.start - a.start); }
export function piiKe(options: PiiKeOptions): Guard {
  return { name: 'pii-ke', version: '0.1.0', description: 'Kenyan PII (National ID, KRA PIN, phone)', category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matches = detect(text, options.entities); const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-ke', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') { let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK[m.type] + r.slice(m.end); return { guardName: 'pii-ke', passed: true, action: 'override', overrideText: r, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type }) => ({ type })) } }; }
      return { guardName: 'pii-ke', passed: false, action: options.action, message: `Kenyan PII: ${[...new Set(matches.map(m => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
