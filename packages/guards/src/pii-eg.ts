import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
type PiiEgEntity = 'national-id-eg' | 'phone-eg';
interface PiiEgOptions { entities: PiiEgEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiEgMatch { type: PiiEgEntity; value: string; start: number; end: number; }
const PATTERNS: Record<PiiEgEntity, RegExp> = { 'national-id-eg': /\b[23]\d{13}\b/g, 'phone-eg': /\b(?:\+?20[-.\s]?)?0?1[0125]\d{8}\b/g };
const MASK: Record<PiiEgEntity, string> = { 'national-id-eg': '[رقم قومي]', 'phone-eg': '[رقم هاتف]' };
function detect(text: string, entities: PiiEgEntity[]): PiiEgMatch[] { const m: PiiEgMatch[] = []; for (const e of entities) { const re = new RegExp(PATTERNS[e].source, 'g'); let x; while ((x = re.exec(text))) m.push({ type: e, value: x[0], start: x.index, end: x.index + x[0].length }); } return m.sort((a, b) => b.start - a.start); }
export function piiEg(options: PiiEgOptions): Guard {
  return { name: 'pii-eg', version: '0.1.0', description: 'Egyptian PII (National ID, phone)', category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matches = detect(text, options.entities); const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-eg', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') { let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK[m.type] + r.slice(m.end); return { guardName: 'pii-eg', passed: true, action: 'override', overrideText: r, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type }) => ({ type })) } }; }
      return { guardName: 'pii-eg', passed: false, action: options.action, message: `Egyptian PII: ${[...new Set(matches.map(m => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
