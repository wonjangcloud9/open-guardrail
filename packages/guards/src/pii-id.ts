import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type PiiIdEntity = 'nik' | 'npwp' | 'phone-id';
interface PiiIdOptions { entities: PiiIdEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiIdMatch { type: PiiIdEntity; value: string; start: number; end: number; }

const PATTERNS: Record<PiiIdEntity, RegExp> = {
  nik: /\b\d{16}\b/g,
  npwp: /\b\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}\b/g,
  'phone-id': /\b(?:\+?62[-.\s]?)?0?\d{2,3}[-.\s]?\d{4}[-.\s]?\d{3,4}\b/g,
};
const MASK: Record<PiiIdEntity, string> = { nik: '[NIK]', npwp: '[NPWP]', 'phone-id': '[Telepon]' };

function detect(text: string, entities: PiiIdEntity[]): PiiIdMatch[] {
  const m: PiiIdMatch[] = [];
  for (const e of entities) { const re = new RegExp(PATTERNS[e].source, 'g'); let x; while ((x = re.exec(text))) m.push({ type: e, value: x[0], start: x.index, end: x.index + x[0].length }); }
  return m.sort((a, b) => b.start - a.start);
}

export function piiId(options: PiiIdOptions): Guard {
  return { name: 'pii-id', version: '0.1.0', description: 'Indonesian PII (NIK, NPWP, phone)', category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matches = detect(text, options.entities); const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-id', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') { let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK[m.type] + r.slice(m.end); return { guardName: 'pii-id', passed: true, action: 'override', overrideText: r, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type }) => ({ type })) } }; }
      return { guardName: 'pii-id', passed: false, action: options.action, message: `Indonesian PII: ${[...new Set(matches.map(m => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
