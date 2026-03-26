import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type PiiJpEntity =
  | 'my-number'
  | 'passport'
  | 'driver-license'
  | 'corporate-number'
  | 'bank-account'
  | 'health-insurance';

interface PiiJpOptions {
  entities: PiiJpEntity[];
  action: 'block' | 'warn' | 'mask';
}

interface PiiJpMatch {
  type: PiiJpEntity;
  value: string;
  start: number;
  end: number;
}

const PATTERNS: Record<PiiJpEntity, RegExp> = {
  'my-number': /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
  passport: /[A-Z]{2}\d{7}/g,
  'driver-license': /\d{12}/g,
  'corporate-number': /\b\d{13}\b/g,
  'bank-account': /\b\d{7}\b/g,
  'health-insurance': /(?:保険者番号|被保険者).{0,20}(\d{6,10})/g,
};

const MASK_LABELS: Record<PiiJpEntity, string> = {
  'my-number': '[マイナンバー]',
  passport: '[パスポート番号]',
  'driver-license': '[運転免許証番号]',
  'corporate-number': '[法人番号]',
  'bank-account': '[口座番号]',
  'health-insurance': '[健康保険番号]',
};

const MY_NUMBER_WEIGHTS = [6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

function validateMyNumber(raw: string): boolean {
  const digits = raw.replace(/\s/g, '');
  if (digits.length !== 12) return false;
  if (/^0+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += Number(digits[i]) * MY_NUMBER_WEIGHTS[i];
  }
  const remainder = sum % 11;
  const check = remainder <= 1 ? 0 : 11 - remainder;
  return check === Number(digits[11]);
}

function detect(
  text: string,
  entities: PiiJpEntity[],
): PiiJpMatch[] {
  const matches: PiiJpMatch[] = [];
  for (const entity of entities) {
    const re = new RegExp(PATTERNS[entity].source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const value = entity === 'health-insurance' && m[1]
        ? m[1]
        : m[0];
      const start = entity === 'health-insurance' && m[1]
        ? m.index + m[0].indexOf(m[1])
        : m.index;
      if (entity === 'my-number' && !validateMyNumber(value)) {
        continue;
      }
      matches.push({
        type: entity,
        value,
        start,
        end: start + value.length,
      });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskText(text: string, matches: PiiJpMatch[]): string {
  let result = text;
  for (const m of matches) {
    result =
      result.slice(0, m.start) +
      MASK_LABELS[m.type] +
      result.slice(m.end);
  }
  return result;
}

export function piiJp(options: PiiJpOptions): Guard {
  return {
    name: 'pii-jp',
    version: '0.1.0',
    description: 'Japanese PII detection and masking',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, options.entities);
      const triggered = matches.length > 0;

      if (!triggered) {
        return {
          guardName: 'pii-jp',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (options.action === 'mask') {
        return {
          guardName: 'pii-jp',
          passed: true,
          action: 'override',
          overrideText: maskText(text, matches),
          latencyMs: Math.round(performance.now() - start),
          details: {
            detected: matches.map(({ type, value }) => ({
              type,
              value,
            })),
          },
        };
      }

      return {
        guardName: 'pii-jp',
        passed: false,
        action: options.action,
        latencyMs: Math.round(performance.now() - start),
        details: {
          detected: matches.map(({ type, value }) => ({
            type,
            value,
          })),
        },
      };
    },
  };
}
