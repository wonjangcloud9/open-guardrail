import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SentenceLengthCheckOptions {
  action: 'block' | 'warn';
  maxWords?: number;
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

export function sentenceLengthCheck(options: SentenceLengthCheckOptions): Guard {
  const maxWords = options.maxWords ?? 50;

  return {
    name: 'sentence-length-check',
    version: '0.1.0',
    description: 'Validates sentence length for readability',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);

      for (const sentence of sentences) {
        const wc = countWords(sentence);
        if (wc > maxWords) {
          issues.push(`Sentence too long (${wc} words): "${sentence.slice(0, 40)}..."`);
        }
        if (wc < 3 && wc > 0 && !/^#+\s/.test(sentence)) {
          issues.push(`Very short sentence (${wc} words): "${sentence.slice(0, 40)}"`);
        }
      }

      const commaHeavy = text.match(/[^.!?]{200,}[.!?]/g) ?? [];
      for (const run of commaHeavy) {
        if ((run.match(/,/g) ?? []).length > 5) {
          issues.push(`Possible run-on sentence: "${run.slice(0, 40)}..."`);
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 4, 1.0) : 0;

      return {
        guardName: 'sentence-length-check',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
