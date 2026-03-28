import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LogInjectionOptions {
  action: 'block' | 'warn';
}

const LOG_PATTERNS: RegExp[] = [
  /\n\s*\[(?:INFO|WARN|ERROR|DEBUG|FATAL|TRACE)\]/,
  /\n\s*(?:INFO|WARN|ERROR|DEBUG|FATAL)\s*[-:]/,
  /\x1b\[/,
  /\u001b\[/,
  /\\x1[bB]\[/,
  /\\u001[bB]\[/,
  /\n.*\d{4}[-\/]\d{2}[-\/]\d{2}\s+\d{2}:\d{2}:\d{2}/,
  /%0[aAdD]/,
  /\\n\s*\[(?:INFO|WARN|ERROR|DEBUG|FATAL)\]/,
  /\r\n.*(?:level|severity)\s*[:=]\s*(?:info|warn|error|debug)/i,
];

export function logInjection(options: LogInjectionOptions): Guard {
  return {
    name: 'log-injection',
    version: '0.1.0',
    description: 'Detects log injection and forging attempts',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of LOG_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'log-injection',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
