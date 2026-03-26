import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MisinformationOptions {
  action: 'block' | 'warn';
}

const MISINFO_PATTERNS: RegExp[] = [
  /\b(?:100%|completely|totally|absolutely)\s+(?:proven|confirmed|certain|true)\b/gi,
  /\bscientists?\s+(?:all\s+)?agree\b/gi,
  /\beveryone\s+knows\b/gi,
  /\bit(?:'s| is) (?:a\s+)?(?:well[- ]known|established)\s+fact\b/gi,
  /\b(?:they|the government|big pharma|mainstream media)\s+don'?t\s+want\s+you\s+to\s+know\b/gi,
  /\b(?:cure|cures)\s+(?:for\s+)?(?:cancer|diabetes|all\s+diseases)\b/gi,
  /\bsecret(?:ly)?\s+(?:revealed|exposed|uncovered|discovered)\b/gi,
  /\bconspiracy\b/gi,
  /\bmiracl(?:e|ous)\s+(?:cure|treatment|remedy|solution)\b/gi,
  /\bthe\s+truth\s+(?:they|that\s+no\s+one)\b/gi,
];

export function misinformation(options: MisinformationOptions): Guard {
  return {
    name: 'misinformation', version: '0.1.0',
    description: 'Detect misinformation patterns and unverified claims',
    category: 'content', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of MISINFO_PATTERNS) {
        const re = new RegExp(p.source, p.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0]);
      }
      const triggered = matched.length > 0;
      return {
        guardName: 'misinformation', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `Potential misinformation: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains patterns associated with misinformation' } : undefined,
      };
    },
  };
}
