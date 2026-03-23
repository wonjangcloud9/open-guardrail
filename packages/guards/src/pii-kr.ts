import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type PiiKrEntity =
  | 'resident-id'
  | 'passport'
  | 'driver-license'
  | 'business-id'
  | 'health-insurance'
  | 'foreigner-id';

interface PiiKrOptions {
  entities: PiiKrEntity[];
  action: 'block' | 'warn' | 'mask';
}

interface PiiKrMatch {
  type: PiiKrEntity;
  value: string;
  start: number;
  end: number;
}

const PATTERNS: Record<PiiKrEntity, RegExp> = {
  'resident-id': /\d{6}-[1-4]\d{6}/g,
  passport: /[A-Z]{1,2}\d{7,8}/g,
  'driver-license': /\d{2}-\d{2}-\d{6}-\d{2}/g,
  'business-id': /\d{3}-\d{2}-\d{5}/g,
  'health-insurance': /(?:건강보험).{0,20}(\d{10,14})/g,
  'foreigner-id': /\d{6}-[5-8]\d{6}/g,
};

const MASK_LABELS: Record<PiiKrEntity, string> = {
  'resident-id': '[주민등록번호]',
  passport: '[여권번호]',
  'driver-license': '[운전면허번호]',
  'business-id': '[사업자등록번호]',
  'health-insurance': '[건강보험번호]',
  'foreigner-id': '[외국인등록번호]',
};

const CHECKSUM_WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];

function validateResidentId(raw: string): boolean {
  const digits = raw.replace('-', '');
  if (digits.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * CHECKSUM_WEIGHTS[i];
  }
  const check = (11 - (sum % 11)) % 10;
  return check === Number(digits[12]);
}

function detect(
  text: string,
  entities: PiiKrEntity[],
): PiiKrMatch[] {
  const matches: PiiKrMatch[] = [];
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
      if (entity === 'resident-id' && !validateResidentId(value)) {
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

function maskText(text: string, matches: PiiKrMatch[]): string {
  let result = text;
  for (const m of matches) {
    result =
      result.slice(0, m.start) +
      MASK_LABELS[m.type] +
      result.slice(m.end);
  }
  return result;
}

export function piiKr(options: PiiKrOptions): Guard {
  return {
    name: 'pii-kr',
    version: '0.1.0',
    description: 'Korean PII detection and masking',
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
          guardName: 'pii-kr',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (options.action === 'mask') {
        return {
          guardName: 'pii-kr',
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
        guardName: 'pii-kr',
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
