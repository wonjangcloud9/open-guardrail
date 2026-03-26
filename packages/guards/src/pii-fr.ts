import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type PiiFrEntity = 'nir' | 'carte-identite' | 'passeport' | 'iban-fr' | 'phone-fr';

interface PiiFrOptions {
  entities: PiiFrEntity[];
  action: 'block' | 'warn' | 'mask';
}

interface PiiFrMatch { type: PiiFrEntity; value: string; start: number; end: number; }

const PATTERNS: Record<PiiFrEntity, RegExp> = {
  nir: /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/g,
  'carte-identite': /\b\d{12}\b/g,
  passeport: /\b\d{2}[A-Z]{2}\d{5}\b/g,
  'iban-fr': /\bFR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{3}\b/g,
  'phone-fr': /\b(?:\+33|0033|0)\s?[1-9](?:\s?\d{2}){4}\b/g,
};

const MASK_LABELS: Record<PiiFrEntity, string> = {
  nir: '[NIR]', 'carte-identite': '[Carte d\'identite]',
  passeport: '[Passeport]', 'iban-fr': '[IBAN]', 'phone-fr': '[Telephone]',
};

function detect(text: string, entities: PiiFrEntity[]): PiiFrMatch[] {
  const matches: PiiFrMatch[] = [];
  for (const entity of entities) {
    const re = new RegExp(PATTERNS[entity].source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ type: entity, value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function mask(text: string, matches: PiiFrMatch[]): string {
  let r = text;
  for (const m of matches) { r = r.slice(0, m.start) + MASK_LABELS[m.type] + r.slice(m.end); }
  return r;
}

export function piiFr(options: PiiFrOptions): Guard {
  return {
    name: 'pii-fr', version: '0.1.0',
    description: 'French PII detection (NIR/INSEE, carte d\'identite, IBAN, phone)',
    category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, options.entities);
      const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-fr', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') {
        return { guardName: 'pii-fr', passed: true, action: 'override', overrideText: mask(text, matches), latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
      }
      return { guardName: 'pii-fr', passed: false, action: options.action, message: `French PII detected: ${[...new Set(matches.map((m) => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
