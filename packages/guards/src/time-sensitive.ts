import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface TimeSensitiveOptions {
  action: 'block' | 'warn';
}

const TIME_PATTERNS: RegExp[] = [
  /\bas of (?:today|now|this (?:moment|time|writing))\b/gi,
  /\bcurrently\b/gi,
  /\bat the time of (?:writing|this response)\b/gi,
  /\bthe latest (?:data|information|report|numbers)\b/gi,
  /\brecent(?:ly)?\s+(?:studies|research|data|reports)\s+(?:show|indicate|suggest)\b/gi,
  /\bin 202[0-9]\b/g,
  /\blast (?:week|month|year|quarter)\b/gi,
  /\bthis (?:week|month|year|quarter)\b/gi,
];

export function timeSensitive(options: TimeSensitiveOptions): Guard {
  return {
    name: 'time-sensitive',
    version: '0.1.0',
    description: 'Detect time-sensitive claims that may become outdated',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of TIME_PATTERNS) {
        const re = new RegExp(p.source, p.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0]);
      }
      const triggered = matched.length > 0;
      return {
        guardName: 'time-sensitive', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `Time-sensitive claim: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Response contains time-dependent claims that may become stale' } : undefined,
      };
    },
  };
}
