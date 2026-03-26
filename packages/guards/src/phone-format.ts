import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type PhoneRegion = 'us' | 'kr' | 'jp' | 'cn' | 'uk' | 'international';

interface PhoneFormatOptions {
  action: 'block' | 'warn' | 'mask';
  regions?: PhoneRegion[];
}

const PHONE_PATTERNS: Record<PhoneRegion, RegExp> = {
  us: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  kr: /\b(?:\+?82[-.\s]?)?0?\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g,
  jp: /\b(?:\+?81[-.\s]?)?0?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{4}\b/g,
  cn: /\b(?:\+?86[-.\s]?)?1[3-9]\d{9}\b/g,
  uk: /\b(?:\+?44[-.\s]?)?0?\d{4}[-.\s]?\d{6}\b/g,
  international: /\+\d{1,3}[-.\s]?\d{1,14}/g,
};

interface PhoneMatch {
  phone: string;
  region: PhoneRegion;
  start: number;
  end: number;
}

const ALL_REGIONS: PhoneRegion[] = ['us', 'kr', 'jp', 'cn', 'uk', 'international'];

function detect(text: string, regions: PhoneRegion[]): PhoneMatch[] {
  const matches: PhoneMatch[] = [];
  const seen = new Set<string>();

  for (const region of regions) {
    const re = new RegExp(PHONE_PATTERNS[region].source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const key = `${m.index}-${m[0].length}`;
      if (seen.has(key)) continue;
      seen.add(key);
      matches.push({
        phone: m[0],
        region,
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskPhones(text: string, matches: PhoneMatch[]): string {
  let result = text;
  for (const m of matches) {
    result =
      result.slice(0, m.start) + '[PHONE]' + result.slice(m.end);
  }
  return result;
}

export function phoneFormat(options: PhoneFormatOptions): Guard {
  const regions = options.regions ?? ALL_REGIONS;

  return {
    name: 'phone-format',
    version: '0.1.0',
    description: 'International phone number detection and masking',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, regions);
      const triggered = matches.length > 0;

      if (!triggered) {
        return {
          guardName: 'phone-format',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (options.action === 'mask') {
        return {
          guardName: 'phone-format',
          passed: true,
          action: 'override',
          overrideText: maskPhones(text, matches),
          latencyMs: Math.round(performance.now() - start),
          details: {
            detected: matches.map(({ phone, region }) => ({
              phone, region,
            })),
          },
        };
      }

      return {
        guardName: 'phone-format',
        passed: false,
        action: options.action,
        latencyMs: Math.round(performance.now() - start),
        details: {
          detected: matches.map(({ phone, region }) => ({
            phone, region,
          })),
        },
      };
    },
  };
}
