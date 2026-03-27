import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface TokenEfficiencyOptions {
  action: 'block' | 'warn';
  /** Min info density ratio (useful tokens / total tokens, default 0.3) */
  minDensity?: number;
  /** Filler words to detect */
  fillerWords?: string[];
}

const DEFAULT_FILLERS = [
  'basically', 'actually', 'literally', 'essentially', 'obviously',
  'clearly', 'certainly', 'definitely', 'honestly', 'frankly',
  'simply', 'really', 'very', 'quite', 'rather', 'somewhat',
  'just', 'like', 'you know', 'i mean', 'kind of', 'sort of',
  'in order to', 'as a matter of fact', 'at the end of the day',
  'it is important to note that', 'it should be noted that',
];

export function tokenEfficiency(options: TokenEfficiencyOptions): Guard {
  const minDensity = options.minDensity ?? 0.3;
  const fillers = (options.fillerWords ?? DEFAULT_FILLERS).map((f) => f.toLowerCase());

  return {
    name: 'token-efficiency',
    version: '0.1.0',
    description: 'Detects low information density and excessive filler in responses',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const words = lower.split(/\s+/).filter(Boolean);
      const totalWords = words.length;

      if (totalWords === 0) {
        return { guardName: 'token-efficiency', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }

      let fillerCount = 0;
      const foundFillers: string[] = [];
      for (const filler of fillers) {
        const parts = filler.split(/\s+/);
        if (parts.length === 1) {
          const c = words.filter((w) => w === filler).length;
          if (c > 0) { fillerCount += c; foundFillers.push(filler); }
        } else {
          let idx = lower.indexOf(filler);
          while (idx !== -1) {
            fillerCount += parts.length;
            if (!foundFillers.includes(filler)) foundFillers.push(filler);
            idx = lower.indexOf(filler, idx + 1);
          }
        }
      }

      const density = 1 - fillerCount / totalWords;
      const triggered = density < minDensity;

      return {
        guardName: 'token-efficiency',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: Math.round(density * 100) / 100,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { density: Math.round(density * 100) / 100, fillerCount, totalWords, topFillers: foundFillers.slice(0, 5) }
          : undefined,
      };
    },
  };
}
