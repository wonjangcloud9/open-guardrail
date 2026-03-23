import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ResidentIdOptions {
  action: 'block' | 'warn' | 'mask';
  validateChecksum?: boolean;
}

interface RidMatch {
  value: string;
  start: number;
  end: number;
}

const RID_PATTERN = /\d{6}-[1-8]\d{6}/g;
const CHECKSUM_WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];

function validateChecksum(raw: string): boolean {
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
  useChecksum: boolean,
): RidMatch[] {
  const matches: RidMatch[] = [];
  const re = new RegExp(RID_PATTERN.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (useChecksum && !validateChecksum(m[0])) continue;
    matches.push({
      value: m[0],
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskRid(rid: string): string {
  const [front, back] = rid.split('-');
  return `${front}-${back[0]}******`;
}

function maskText(text: string, matches: RidMatch[]): string {
  let result = text;
  for (const m of matches) {
    result =
      result.slice(0, m.start) +
      maskRid(m.value) +
      result.slice(m.end);
  }
  return result;
}

export function residentId(options: ResidentIdOptions): Guard {
  const useChecksum = options.validateChecksum ?? true;

  return {
    name: 'resident-id',
    version: '0.1.0',
    description: 'Korean resident ID detection with checksum',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, useChecksum);
      const triggered = matches.length > 0;

      if (!triggered) {
        return {
          guardName: 'resident-id',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (options.action === 'mask') {
        return {
          guardName: 'resident-id',
          passed: true,
          action: 'override',
          overrideText: maskText(text, matches),
          latencyMs: Math.round(performance.now() - start),
          details: {
            detected: matches.map((m) => m.value),
          },
        };
      }

      return {
        guardName: 'resident-id',
        passed: false,
        action: options.action,
        latencyMs: Math.round(performance.now() - start),
        details: {
          detected: matches.map((m) => m.value),
        },
      };
    },
  };
}
