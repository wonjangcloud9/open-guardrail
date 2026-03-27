import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PromptCacheSafetyOptions {
  action: 'block' | 'warn';
  /** Max allowed cache key length (default 256) */
  maxKeyLength?: number;
  /** Deny patterns in cache keys */
  denyPatterns?: RegExp[];
  /** Detect cache poisoning attempts */
  detectPoisoning?: boolean;
}

const CACHE_POISON_PATTERNS = [
  /\bcache[_\-\s]*(?:bust|poison|invalidat|corrupt|overflow)/i,
  /\b(?:overwrite|replace|inject)\s+(?:cached|cache)/i,
  /\b__cache__|__memo__|__lru__/i,
  /[\x00-\x08\x0b\x0c\x0e-\x1f]/,
  /\x00/,
];

export function promptCacheSafety(options: PromptCacheSafetyOptions): Guard {
  const maxKeyLen = options.maxKeyLength ?? 256;
  const detectPoisoning = options.detectPoisoning ?? true;

  return {
    name: 'prompt-cache-safety',
    version: '0.1.0',
    description: 'Prevents prompt cache poisoning and key manipulation',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];

      if (text.length > maxKeyLen * 100) {
        violations.push(`Input exceeds safe cache boundary (${text.length} chars)`);
      }

      if (detectPoisoning) {
        for (const pat of CACHE_POISON_PATTERNS) {
          const m = text.match(pat);
          if (m) {
            violations.push(`Cache poisoning pattern: ${m[0]}`);
          }
        }
      }

      if (options.denyPatterns) {
        for (const pat of options.denyPatterns) {
          const m = text.match(pat);
          if (m) {
            violations.push(`Denied pattern in cache context: ${m[0]}`);
          }
        }
      }

      const triggered = violations.length > 0;
      return {
        guardName: 'prompt-cache-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations } : undefined,
      };
    },
  };
}
