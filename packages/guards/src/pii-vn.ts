import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
type PiiVnEntity = 'cccd' | 'cmnd' | 'phone-vn' | 'mst';
interface PiiVnOptions { entities: PiiVnEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiVnMatch { type: PiiVnEntity; value: string; start: number; end: number; }
const PATTERNS: Record<PiiVnEntity, RegExp> = {
  cccd: /\b0\d{11}\b/g, cmnd: /\b\d{9}\b/g,
  'phone-vn': /\b(?:\+?84[-.\s]?)?0?\d{2}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g,
  mst: /\b\d{10}(?:-\d{3})?\b/g,
};
const MASK: Record<PiiVnEntity, string> = { cccd: '[CCCD]', cmnd: '[CMND]', 'phone-vn': '[SĐT]', mst: '[MST]' };
function detect(text: string, entities: PiiVnEntity[]): PiiVnMatch[] {
  const m: PiiVnMatch[] = []; for (const e of entities) { const re = new RegExp(PATTERNS[e].source, 'g'); let x; while ((x = re.exec(text))) m.push({ type: e, value: x[0], start: x.index, end: x.index + x[0].length }); } return m.sort((a, b) => b.start - a.start);
}
export function piiVn(options: PiiVnOptions): Guard {
  return { name: 'pii-vn', version: '0.1.0', description: 'Vietnamese PII (CCCD, CMND, phone, MST)', category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matches = detect(text, options.entities); const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-vn', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') { let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK[m.type] + r.slice(m.end); return { guardName: 'pii-vn', passed: true, action: 'override', overrideText: r, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type }) => ({ type })) } }; }
      return { guardName: 'pii-vn', passed: false, action: options.action, message: `Vietnamese PII: ${[...new Set(matches.map(m => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
