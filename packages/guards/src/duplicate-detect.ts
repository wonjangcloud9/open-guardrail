import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface DuplicateDetectOptions {
  action: 'block' | 'warn';
  threshold?: number;
}

function findDuplicateSentences(text: string): { duplicates: string[]; ratio: number } {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 10);

  if (sentences.length <= 1) return { duplicates: [], ratio: 0 };

  const seen = new Map<string, number>();
  const duplicates: string[] = [];

  for (const s of sentences) {
    const count = (seen.get(s) ?? 0) + 1;
    seen.set(s, count);
    if (count === 2) duplicates.push(s);
  }

  return {
    duplicates,
    ratio: duplicates.length / sentences.length,
  };
}

function findDuplicateParagraphs(text: string): string[] {
  const paras = text
    .split(/\n\n+/)
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length > 20);

  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const p of paras) {
    if (seen.has(p)) duplicates.push(p.slice(0, 50) + '...');
    else seen.add(p);
  }

  return duplicates;
}

export function duplicateDetect(options: DuplicateDetectOptions): Guard {
  const threshold = options.threshold ?? 0.3;

  return {
    name: 'duplicate-detect',
    version: '0.1.0',
    description: 'Detect duplicate sentences and paragraphs in output',
    category: 'content',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const { duplicates: dupSentences, ratio } = findDuplicateSentences(text);
      const dupParas = findDuplicateParagraphs(text);

      const triggered = ratio >= threshold || dupParas.length > 0;

      return {
        guardName: 'duplicate-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: ratio,
        message: triggered
          ? `Duplicate content detected: ${dupSentences.length} repeated sentence(s), ${dupParas.length} repeated paragraph(s)`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              duplicateSentences: dupSentences.slice(0, 5),
              duplicateParagraphs: dupParas.slice(0, 3),
              duplicateRatio: ratio,
              reason: 'Output contains repeated sentences or paragraphs indicating low-quality generation',
            }
          : undefined,
      };
    },
  };
}
