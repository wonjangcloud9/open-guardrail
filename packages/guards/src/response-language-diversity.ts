import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseLanguageDiversityOptions {
  action: 'block' | 'warn';
  minDiversity?: number;
}

function computeDiversity(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g);
  if (!words || words.length < 5) return 1.0;

  const unique = new Set(words);
  const uniqueRatio = unique.size / words.length;

  const lengths = words.map((w) => w.length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((s, l) => s + (l - avgLen) ** 2, 0) / lengths.length;
  const lenVariance = Math.min(Math.sqrt(variance) / 5, 1.0);

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentLens = sentences.map((s) => s.trim().split(/\s+/).length);
  let sentVariety = 0.5;
  if (sentLens.length >= 2) {
    const avgSent = sentLens.reduce((a, b) => a + b, 0) / sentLens.length;
    const sentVar = sentLens.reduce((s, l) => s + (l - avgSent) ** 2, 0) / sentLens.length;
    sentVariety = Math.min(Math.sqrt(sentVar) / 10, 1.0);
  }

  return (uniqueRatio * 0.5 + lenVariance * 0.25 + sentVariety * 0.25);
}

export function responseLanguageDiversity(options: ResponseLanguageDiversityOptions): Guard {
  const minDiv = options.minDiversity ?? 0.2;

  return {
    name: 'response-language-diversity',
    version: '0.1.0',
    description: 'Measures language diversity of response',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const diversity = computeDiversity(text);
      const triggered = diversity < minDiv;
      const score = triggered ? 1.0 - diversity : 0;

      return {
        guardName: 'response-language-diversity',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: { diversity: Math.round(diversity * 1000) / 1000, minDiversity: minDiv },
      };
    },
  };
}
