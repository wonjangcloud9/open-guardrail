import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ChunkPoisonPatternOptions {
  action: 'block' | 'warn';
}

const POISON_PATTERNS: RegExp[] = [
  /\bignore\s+above\b/i,
  /\bnew\s+instructions:/i,
  /\bsystem\s+override\b/i,
  /\bIMPORTANT:/,
  /\bADMIN:/,
  /\byou\s+must\s+now\b/i,
  /\bdisregard\s+context\b/i,
  /\bforget\s+the\s+above\b/i,
  /\binstead\s+do\b/i,
  /\bactually,\s/i,
  /\bcorrection:/i,
  /\boverride:/i,
  /\breal\s+instructions:/i,
  /\bhidden\s+instruction\b/i,
];

export function chunkPoisonPattern(options: ChunkPoisonPatternOptions): Guard {
  return {
    name: 'chunk-poison-pattern',
    version: '0.1.0',
    description: 'Detects injected instructions hidden inside retrieved chunks',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of POISON_PATTERNS) {
        const m = text.match(pattern);
        if (m) matched.push(m[0]);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'chunk-poison-pattern',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedPatterns: matched }
          : undefined,
      };
    },
  };
}
