import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface BanCodeOptions {
  action: 'block' | 'warn';
  languages?: string[];
}

const CODE_PATTERNS: Record<string, RegExp> = {
  'code-block': /```[\s\S]*?```/g,
  'inline-code': /`[^`]+`/g,
  javascript: /(?:function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|=>\s*\{|import\s+\{)/g,
  python: /(?:def\s+\w+\(|class\s+\w+[:(]|import\s+\w+|from\s+\w+\s+import|if\s+__name__)/g,
  sql: /(?:SELECT\s+.*FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+TABLE)/gi,
  html: /<(?:div|span|p|h[1-6]|ul|ol|li|table|form|input|button)[^>]*>/gi,
  shell: /(?:sudo\s+|chmod\s+|chown\s+|rm\s+-|curl\s+|wget\s+|apt\s+|pip\s+install)/g,
};

const ALL_LANGUAGES = Object.keys(CODE_PATTERNS);

export function banCode(options: BanCodeOptions): Guard {
  const languages = options.languages ?? ALL_LANGUAGES;

  return {
    name: 'ban-code',
    version: '0.1.0',
    description: 'Detect and block code blocks in text',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const detected: Record<string, number> = {};

      for (const lang of languages) {
        const pattern = CODE_PATTERNS[lang];
        if (!pattern) continue;
        const re = new RegExp(pattern.source, pattern.flags);
        const matches = text.match(re);
        if (matches && matches.length > 0) {
          detected[lang] = matches.length;
        }
      }

      const triggered = Object.keys(detected).length > 0;

      return {
        guardName: 'ban-code',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { detected } : undefined,
      };
    },
  };
}
