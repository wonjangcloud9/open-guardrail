import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type PiiBrEntity = 'cpf' | 'cnpj' | 'rg' | 'phone-br';

interface PiiBrOptions {
  entities: PiiBrEntity[];
  action: 'block' | 'warn' | 'mask';
}

interface PiiBrMatch { type: PiiBrEntity; value: string; start: number; end: number; }

const PATTERNS: Record<PiiBrEntity, RegExp> = {
  cpf: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
  cnpj: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g,
  rg: /\b\d{2}\.\d{3}\.\d{3}-[\dXx]\b/g,
  'phone-br': /\b(?:\+55|0055)?\s?\(?0?\d{2}\)?\s?\d{4,5}-?\d{4}\b/g,
};

const MASK_LABELS: Record<PiiBrEntity, string> = {
  cpf: '[CPF]', cnpj: '[CNPJ]', rg: '[RG]', 'phone-br': '[Telefone]',
};

function validateCpf(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (check !== Number(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return check === Number(digits[10]);
}

function detect(text: string, entities: PiiBrEntity[]): PiiBrMatch[] {
  const matches: PiiBrMatch[] = [];
  for (const entity of entities) {
    const re = new RegExp(PATTERNS[entity].source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (entity === 'cpf' && !validateCpf(m[0])) continue;
      matches.push({ type: entity, value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function mask(text: string, matches: PiiBrMatch[]): string {
  let r = text;
  for (const m of matches) { r = r.slice(0, m.start) + MASK_LABELS[m.type] + r.slice(m.end); }
  return r;
}

export function piiBr(options: PiiBrOptions): Guard {
  return {
    name: 'pii-br', version: '0.1.0',
    description: 'Brazilian PII detection (CPF with checksum, CNPJ, RG, phone)',
    category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, options.entities);
      const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'pii-br', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') {
        return { guardName: 'pii-br', passed: true, action: 'override', overrideText: mask(text, matches), latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
      }
      return { guardName: 'pii-br', passed: false, action: options.action, message: `Brazilian PII detected: ${[...new Set(matches.map((m) => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })) } };
    },
  };
}
