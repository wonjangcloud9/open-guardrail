import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type PiiCnEntity =
  | 'id-card'
  | 'passport'
  | 'bank-card'
  | 'social-security'
  | 'phone';

interface PiiCnOptions {
  entities: PiiCnEntity[];
  action: 'block' | 'warn' | 'mask';
}

interface PiiCnMatch {
  type: PiiCnEntity;
  value: string;
  start: number;
  end: number;
}

const PATTERNS: Record<PiiCnEntity, RegExp> = {
  'id-card': /\b\d{17}[\dXx]\b/g,
  passport: /[EGeDSPHegdsph]\d{8}/g,
  'bank-card': /\b\d{16,19}\b/g,
  'social-security': /\b\d{18}\b/g,
  phone: /(?:1[3-9]\d{9})/g,
};

const MASK_LABELS: Record<PiiCnEntity, string> = {
  'id-card': '[身份证号]',
  passport: '[护照号]',
  'bank-card': '[银行卡号]',
  'social-security': '[社保号]',
  phone: '[手机号]',
};

const ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const ID_CHECK_MAP = '10X98765432';

function validateIdCard(raw: string): boolean {
  if (raw.length !== 18) return false;
  const digits = raw.toUpperCase();
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const d = Number(digits[i]);
    if (isNaN(d)) return false;
    sum += d * ID_WEIGHTS[i];
  }
  const check = ID_CHECK_MAP[sum % 11];
  return check === digits[17];
}

function isValidRegion(raw: string): boolean {
  const region = Number(raw.slice(0, 2));
  const validPrefixes = [
    11, 12, 13, 14, 15, 21, 22, 23,
    31, 32, 33, 34, 35, 36, 37, 41,
    42, 43, 44, 45, 46, 50, 51, 52,
    53, 54, 61, 62, 63, 64, 65,
  ];
  return validPrefixes.includes(region);
}

function detect(
  text: string,
  entities: PiiCnEntity[],
): PiiCnMatch[] {
  const matches: PiiCnMatch[] = [];
  for (const entity of entities) {
    const re = new RegExp(PATTERNS[entity].source, PATTERNS[entity].flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const value = m[0];
      if (entity === 'id-card') {
        if (!validateIdCard(value) || !isValidRegion(value)) continue;
      }
      matches.push({
        type: entity,
        value,
        start: m.index,
        end: m.index + value.length,
      });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskText(text: string, matches: PiiCnMatch[]): string {
  let result = text;
  for (const m of matches) {
    result =
      result.slice(0, m.start) +
      MASK_LABELS[m.type] +
      result.slice(m.end);
  }
  return result;
}

export function piiCn(options: PiiCnOptions): Guard {
  return {
    name: 'pii-cn',
    version: '0.1.0',
    description: 'Chinese PII detection and masking',
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
          guardName: 'pii-cn',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (options.action === 'mask') {
        return {
          guardName: 'pii-cn',
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
        guardName: 'pii-cn',
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
