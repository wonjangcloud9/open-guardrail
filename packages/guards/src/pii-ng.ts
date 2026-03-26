import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
type PiiNgEntity = 'nin' | 'bvn' | 'phone-ng';
interface PiiNgOptions { entities: PiiNgEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiNgMatch { type: PiiNgEntity; value: string; start: number; end: number; }
const PATTERNS: Record<PiiNgEntity, RegExp> = { nin: /\b\d{11}\b/g, bvn: /\b\d{11}\b/g, 'phone-ng': /\b(?:\+?234[-.\s]?)?0?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g };
const MASK: Record<PiiNgEntity, string> = { nin: '[NIN]', bvn: '[BVN]', 'phone-ng': '[Phone]' };
function detect(text: string, entities: PiiNgEntity[]): PiiNgMatch[] {
  const m: PiiNgMatch[] = []; for (const e of entities) { const re = new RegExp(PATTERNS[e].source, 'g'); let x; while ((x = re.exec(text))) m.push({ type: e, value: x[0], start: x.index, end: x.index + x[0].length }); } return m.sort((a, b) => b.start - a.start);
}
export function piiNg(options: PiiNgOptions): Guard {
  return { name: 'pii-ng', version: '0.1.0', description: 'Nigerian PII (NIN, BVN, phone)', category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matches = detect(text, options.entities); const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-ng', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') { let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK[m.type] + r.slice(m.end); return { guardName: 'pii-ng', passed: true, action: 'override', overrideText: r, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type }) => ({ type })) } }; }
      return { guardName: 'pii-ng', passed: false, action: options.action, message: `Nigerian PII: ${[...new Set(matches.map(m => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
