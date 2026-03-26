import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ReadabilityOptions {
  action: 'block' | 'warn';
  minScore?: number;
  maxScore?: number;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  let count = 0;
  const vowels = 'aeiouy';
  let prevVowel = false;
  for (const ch of w) {
    const isVowel = vowels.includes(ch);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  if (w.endsWith('e') && count > 1) count--;
  return Math.max(1, count);
}

function fleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
  if (sentences.length === 0 || words.length === 0) return 100;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  return 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
}

function getGrade(score: number): string {
  if (score >= 90) return 'very-easy';
  if (score >= 80) return 'easy';
  if (score >= 70) return 'fairly-easy';
  if (score >= 60) return 'standard';
  if (score >= 50) return 'fairly-difficult';
  if (score >= 30) return 'difficult';
  return 'very-difficult';
}

export function readability(options: ReadabilityOptions): Guard {
  return {
    name: 'readability',
    version: '0.1.0',
    description: 'Flesch Reading Ease score validation',
    category: 'content',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const score = fleschReadingEase(text);
      const grade = getGrade(score);

      let triggered = false;
      if (options.minScore !== undefined && score < options.minScore) triggered = true;
      if (options.maxScore !== undefined && score > options.maxScore) triggered = true;

      return {
        guardName: 'readability',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: Math.round(score * 10) / 10,
        latencyMs: Math.round(performance.now() - start),
        details: { fleschScore: Math.round(score * 10) / 10, grade },
      };
    },
  };
}
