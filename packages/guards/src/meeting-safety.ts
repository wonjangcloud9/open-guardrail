import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface MeetingSafetyOptions {
  action: 'block' | 'warn';
}

const PATTERNS: [RegExp, string][] = [
  [/\bconfidential\b/gi, 'confidential mention'],
  [/\bdo\s+not\s+share\b/gi, 'do not share'],
  [/\boff\s+the\s+record\b/gi, 'off the record'],
  [/\bunder\s+NDA\b/gi, 'NDA-protected'],
  [/\bmaterial\s+non[- ]public\s+information\b/gi, 'MNPI'],
  [/\battorney[- ]client\s+privilege\b/gi, 'legal privilege'],
  [/\bmerger\b.*\bacquisition\b|\bacquisition\b.*\bmerger\b/gi, 'M&A discussion'],
  [/\bearnings\s+(?:preview|pre[- ]?release|before\s+(?:announce|release))\b/gi, 'earnings preview'],
  [/\binsider\s+(?:information|trading|knowledge)\b/gi, 'insider information'],
  [/\blegal(?:ly)?\s+privileged\b/gi, 'legal privilege'],
  [/\bproprietary\s+(?:information|data|process)\b/gi, 'proprietary info'],
  [/\btrade\s+secret\b/gi, 'trade secret'],
];

export function meetingSafety(options: MeetingSafetyOptions): Guard {
  return {
    name: 'meeting-safety',
    version: '0.1.0',
    description:
      'Detects confidential discussions, NDA content, insider info in meetings/transcripts',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const found: string[] = [];

      for (const [pattern, label] of PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) found.push(label);
      }

      const unique = [...new Set(found)];
      const triggered = unique.length > 0;

      return {
        guardName: 'meeting-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Sensitive meeting content: ${unique.join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { flags: unique } : undefined,
      };
    },
  };
}
