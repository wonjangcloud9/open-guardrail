import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type PiiMxEntity = 'curp' | 'rfc' | 'nss' | 'phone-mx';

interface PiiMxOptions { entities: PiiMxEntity[]; action: 'block' | 'warn' | 'mask'; }
interface PiiMxMatch { type: PiiMxEntity; value: string; start: number; end: number; }

const PATTERNS: Record<PiiMxEntity, RegExp> = {
  curp: /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/g,
  rfc: /\b[A-Z]{3,4}\d{6}[A-Z0-9]{3}\b/g,
  nss: /\b\d{11}\b/g,
  'phone-mx': /\b(?:\+?52[-.\s]?)?\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g,
};

const MASK_LABELS: Record<PiiMxEntity, string> = {
  curp: '[CURP]', rfc: '[RFC]', nss: '[NSS]', 'phone-mx': '[Telefono]',
};

function detect(text: string, entities: PiiMxEntity[]): PiiMxMatch[] {
  const matches: PiiMxMatch[] = [];
  for (const e of entities) {
    const re = new RegExp(PATTERNS[e].source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) matches.push({ type: e, value: m[0], start: m.index, end: m.index + m[0].length });
  }
  return matches.sort((a, b) => b.start - a.start);
}

function mask(text: string, matches: PiiMxMatch[]): string {
  let r = text; for (const m of matches) r = r.slice(0, m.start) + MASK_LABELS[m.type] + r.slice(m.end); return r;
}

export function piiMx(options: PiiMxOptions): Guard {
  return {
    name: 'pii-mx', version: '0.1.0', description: 'Mexican PII (CURP, RFC, NSS, phone)',
    category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, options.entities);
      const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-mx', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') return { guardName: 'pii-mx', passed: true, action: 'override', overrideText: mask(text, matches), latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
      return { guardName: 'pii-mx', passed: false, action: options.action, message: `Mexican PII: ${[...new Set(matches.map((m) => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
