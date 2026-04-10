import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface OutputDistributionAnomalyOptions {
  action: 'block' | 'warn';
  /** Rolling window size (default 10) */
  windowSize?: number;
}

interface ResponseProfile {
  length: number;
  hasUnusualChars: boolean;
  dominantScript: string;
  isCode: boolean;
  repetitionRatio: number;
}

const SCRIPT_PATTERNS: [string, RegExp][] = [
  ['latin', /[a-zA-Z]/g],
  ['cjk', /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g],
  ['cyrillic', /[\u0400-\u04ff]/g],
  ['arabic', /[\u0600-\u06ff]/g],
  ['devanagari', /[\u0900-\u097f]/g],
];

const CODE_INDICATORS = /[{}\[\]();=<>]|function\s|const\s|let\s|var\s|def\s|class\s|import\s|return\s/;
const UNUSUAL_CHARS = /[\x00-\x08\x0e-\x1f\x7f-\x9f\u200b-\u200f\u2028-\u202f\ufeff]/;

function detectScript(text: string): string {
  let best = 'unknown';
  let bestCount = 0;
  for (const [name, re] of SCRIPT_PATTERNS) {
    const matches = text.match(re);
    const count = matches ? matches.length : 0;
    if (count > bestCount) {
      bestCount = count;
      best = name;
    }
  }
  return best;
}

function computeRepetition(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return 0;
  const bigrams = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const key = `${words[i]} ${words[i + 1]}`;
    bigrams.set(key, (bigrams.get(key) ?? 0) + 1);
  }
  const totalBigrams = words.length - 1;
  const repeated = [...bigrams.values()].filter((c) => c > 1).reduce((a, b) => a + b, 0);
  return totalBigrams > 0 ? repeated / totalBigrams : 0;
}

function profile(text: string): ResponseProfile {
  return {
    length: text.length,
    hasUnusualChars: UNUSUAL_CHARS.test(text),
    dominantScript: detectScript(text),
    isCode: CODE_INDICATORS.test(text),
    repetitionRatio: computeRepetition(text),
  };
}

export function outputDistributionAnomaly(options: OutputDistributionAnomalyOptions): Guard {
  const windowSize = options.windowSize ?? 10;
  const history: ResponseProfile[] = [];

  return {
    name: 'output-distribution-anomaly',
    version: '0.1.0',
    description: 'Detects anomalous output patterns deviating from expected distribution',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const current = profile(text);
      const warming = history.length < windowSize;

      const anomalies: string[] = [];

      if (!warming) {
        const avgLen = history.reduce((s, h) => s + h.length, 0) / history.length;
        if (avgLen > 0 && (current.length > avgLen * 5 || current.length < avgLen * 0.2)) {
          anomalies.push('response_length');
        }

        if (current.hasUnusualChars) {
          anomalies.push('unusual_characters');
        }

        const prevScript = history[history.length - 1]?.dominantScript;
        if (prevScript && current.dominantScript !== prevScript) {
          anomalies.push('language_switch');
        }

        const prevCode = history[history.length - 1]?.isCode;
        if (prevCode !== undefined && current.isCode !== prevCode) {
          anomalies.push('format_change');
        }

        const avgRep = history.reduce((s, h) => s + h.repetitionRatio, 0) / history.length;
        if (avgRep > 0 && current.repetitionRatio > avgRep * 3) {
          anomalies.push('repetition_spike');
        }
      }

      const triggered = anomalies.length > 0;

      history.push(current);
      if (history.length > windowSize) history.shift();

      return {
        guardName: 'output-distribution-anomaly',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { anomalies, currentLength: current.length, dominantScript: current.dominantScript, repetitionRatio: Math.round(current.repetitionRatio * 100) / 100 }
          : undefined,
      };
    },
  };
}
