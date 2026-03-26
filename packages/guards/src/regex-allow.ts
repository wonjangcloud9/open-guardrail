import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RegexAllowOptions {
  action: 'block' | 'warn';
  patterns: { pattern: string; flags?: string; label: string }[];
  requireAll?: boolean;
}

export function regexAllow(options: RegexAllowOptions): Guard {
  const requireAll = options.requireAll ?? false;
  const compiled = options.patterns.map((p) => ({
    re: new RegExp(p.pattern, p.flags ?? 'gi'),
    label: p.label,
  }));

  return {
    name: 'regex-allow', version: '0.1.0',
    description: 'Require text to match allowed regex patterns',
    category: 'format', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      const missing: string[] = [];

      for (const { re, label } of compiled) {
        const regex = new RegExp(re.source, re.flags);
        if (regex.test(text)) matched.push(label);
        else missing.push(label);
      }

      const triggered = requireAll
        ? missing.length > 0
        : matched.length === 0;

      return {
        guardName: 'regex-allow', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? requireAll
            ? `Missing required patterns: ${missing.join(', ')}`
            : 'No allowed patterns found in text'
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: { matched, missing, reason: triggered ? 'Text does not match required patterns' : undefined },
      };
    },
  };
}
