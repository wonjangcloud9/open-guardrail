import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type ClassLevel = 'public' | 'internal' | 'confidential' | 'restricted';

interface DataClassificationOptions {
  action: 'block' | 'warn';
  minLevel?: ClassLevel;
}

const LEVEL_ORDER: ClassLevel[] = ['public', 'internal', 'confidential', 'restricted'];

const CLASSIFICATION_PATTERNS: { pattern: RegExp; level: ClassLevel }[] = [
  { pattern: /\btop\s+secret\b/i, level: 'restricted' },
  { pattern: /\beyes\s+only\b/i, level: 'restricted' },
  { pattern: /\bclassified\b/i, level: 'restricted' },
  { pattern: /\brestricted\b/i, level: 'restricted' },
  { pattern: /\bconfidential\b/i, level: 'confidential' },
  { pattern: /\bproprietary\b/i, level: 'confidential' },
  { pattern: /\btrade\s+secret\b/i, level: 'confidential' },
  { pattern: /\bembargo(ed)?\b/i, level: 'confidential' },
  { pattern: /\binternal\s+only\b/i, level: 'internal' },
];

export function dataClassification(options: DataClassificationOptions): Guard {
  const minLevel = options.minLevel ?? 'confidential';
  const minIdx = LEVEL_ORDER.indexOf(minLevel);

  return {
    name: 'data-classification',
    version: '0.1.0',
    description: 'Classifies data sensitivity level',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      let highestLevel: ClassLevel = 'public';
      const matched: string[] = [];

      for (const { pattern, level } of CLASSIFICATION_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
          const lvlIdx = LEVEL_ORDER.indexOf(level);
          if (lvlIdx > LEVEL_ORDER.indexOf(highestLevel)) highestLevel = level;
        }
      }

      const highestIdx = LEVEL_ORDER.indexOf(highestLevel);
      const triggered = highestIdx >= minIdx;
      const score = highestIdx / (LEVEL_ORDER.length - 1);

      return {
        guardName: 'data-classification',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        message: triggered ? `Sensitive data (${highestLevel}) exceeds threshold (${minLevel})` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: { classificationLevel: highestLevel, matchedPatterns: matched.length },
      };
    },
  };
}
