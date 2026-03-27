import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LanguageComplexityOptions {
  action: 'block' | 'warn';
  maxGradeLevel?: number;
  minGradeLevel?: number;
}

export function languageComplexity(options: LanguageComplexityOptions): Guard {
  const maxGrade = options.maxGradeLevel ?? 12;
  const minGrade = options.minGradeLevel ?? 0;

  return {
    name: 'language-complexity',
    version: '0.1.0',
    description: 'Enforces reading grade level bounds on text',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const words = text.split(/\s+/).filter(Boolean);
      const syllables = words.reduce((sum, w) => sum + Math.max(1, w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/i, '').match(/[aeiouy]{1,2}/gi)?.length ?? 1), 0);
      const avgSentLen = words.length / Math.max(sentences.length, 1);
      const avgSyllables = syllables / Math.max(words.length, 1);
      const grade = Math.round(0.39 * avgSentLen + 11.8 * avgSyllables - 15.59);
      const tooHigh = grade > maxGrade;
      const tooLow = grade < minGrade;
      const triggered = tooHigh || tooLow;
      return { guardName: 'language-complexity', passed: !triggered, action: triggered ? options.action : 'allow', score: grade, latencyMs: Math.round(performance.now() - start), details: triggered ? { gradeLevel: grade, maxGrade, minGrade, reason: tooHigh ? 'too-complex' : 'too-simple' } : undefined };
    },
  };
}
