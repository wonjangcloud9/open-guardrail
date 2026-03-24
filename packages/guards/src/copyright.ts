import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CopyrightOptions {
  action: 'block' | 'warn';
  detectVerbatim?: boolean;
  maxQuoteLength?: number;
}

const COPYRIGHT_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'copyright-symbol', pattern: /©\s*\d{4}/gi },
  { name: 'copyright-word', pattern: /\bcopyright\s+\d{4}/gi },
  { name: 'all-rights-reserved', pattern: /all\s+rights\s+reserved/gi },
  { name: 'trademark', pattern: /[™®]/g },
  { name: 'licensed-under', pattern: /licensed\s+under\s+(the\s+)?\w+(\s+license)?/gi },
  { name: 'do-not-reproduce', pattern: /do\s+not\s+(reproduce|copy|distribute)/gi },
  { name: 'proprietary', pattern: /\b(proprietary|confidential)\s+(information|material|content)/gi },
];

export function copyright(options: CopyrightOptions): Guard {
  const detectVerbatim = options.detectVerbatim ?? false;
  const maxQuoteLength = options.maxQuoteLength ?? 100;

  return {
    name: 'copyright',
    version: '0.7.0',
    description: 'Detects copyright notices, trademarks, and potential verbatim reproduction',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches: string[] = [];

      for (const { name, pattern } of COPYRIGHT_PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) {
          matches.push(name);
        }
      }

      if (detectVerbatim) {
        const quotePattern = /"([^"]{2,})"/g;
        let match: RegExpExecArray | null;
        while ((match = quotePattern.exec(text)) !== null) {
          if (match[1].length > maxQuoteLength) {
            matches.push('verbatim-quote');
            break;
          }
        }
      }

      const triggered = matches.length > 0;
      const score = triggered ? Math.min(matches.length / 5, 1.0) : 0;

      return {
        guardName: 'copyright',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matches } : undefined,
      };
    },
  };
}
