import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ApiAbuseDetectOptions {
  action: 'block' | 'warn';
}

const ENUM_PATTERN = /(?:id|page|offset|index|num)[\s=:]+(\d+)/gi;
const BRUTE_FORCE_PATTERNS: RegExp[] = [
  /(?:password|passwd|pwd|token|key)[\s=:]+\S+/gi,
  /(?:login|auth|signin)\s/i,
];
const FUZZING_PATTERNS: RegExp[] = [
  /['"<>{}|\\^~`]/,
  /(\x00|\x0a|\x0d|%00|%0a|%0d)/i,
  /\.\.\//,
  /(?:AAAA{10,}|xxxx{10,})/i,
];
const SEQUENTIAL_PATTERN = /(\d+)(?:\s*,\s*|\s+)(\d+)(?:\s*,\s*|\s+)(\d+)/;

export function apiAbuseDetect(options: ApiAbuseDetectOptions): Guard {
  return {
    name: 'api-abuse-detect',
    version: '0.1.0',
    description: 'Detects API abuse patterns like enumeration and fuzzing',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      // Enumeration detection
      const enumMatches = [...text.matchAll(new RegExp(ENUM_PATTERN.source, 'gi'))];
      if (enumMatches.length >= 3) {
        issues.push('enumeration_pattern');
      }

      // Sequential number detection
      const seqMatch = text.match(SEQUENTIAL_PATTERN);
      if (seqMatch) {
        const a = parseInt(seqMatch[1], 10);
        const b = parseInt(seqMatch[2], 10);
        const c = parseInt(seqMatch[3], 10);
        if (b - a === c - b && b - a >= 1 && b - a <= 10) {
          issues.push('sequential_ids');
        }
      }

      // Brute force patterns
      for (const pat of BRUTE_FORCE_PATTERNS) {
        const matches = [...text.matchAll(new RegExp(pat.source, 'gi'))];
        if (matches.length >= 3) {
          issues.push('brute_force_pattern');
          break;
        }
      }

      // Parameter fuzzing
      let fuzzCount = 0;
      for (const pat of FUZZING_PATTERNS) {
        if (pat.test(text)) fuzzCount++;
      }
      if (fuzzCount >= 2) {
        issues.push('parameter_fuzzing');
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'api-abuse-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
