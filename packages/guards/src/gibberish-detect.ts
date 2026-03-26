import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface GibberishDetectOptions {
  action: 'block' | 'warn';
  threshold?: number;
}

const VOWELS = new Set('aeiouAEIOU');
const CONSONANTS = new Set('bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ');

function vowelRatio(text: string): number {
  const alpha = [...text].filter((c) => /[a-zA-Z]/.test(c));
  if (alpha.length === 0) return 0.5;
  const vowelCount = alpha.filter((c) => VOWELS.has(c)).length;
  return vowelCount / alpha.length;
}

function repeatedCharRatio(text: string): number {
  if (text.length < 2) return 0;
  let repeated = 0;
  for (let i = 1; i < text.length; i++) {
    if (text[i] === text[i - 1]) repeated++;
  }
  return repeated / (text.length - 1);
}

function maxConsecutiveConsonants(text: string): number {
  let max = 0;
  let current = 0;
  for (const c of text) {
    if (CONSONANTS.has(c)) {
      current++;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }
  return max;
}

function specialCharRatio(text: string): number {
  if (text.length === 0) return 0;
  const special = [...text].filter(
    (c) => !/[a-zA-Z0-9\s.,!?;:'"()\-\u3000-\u9FFF\uAC00-\uD7AF\u3040-\u30FF]/.test(c),
  ).length;
  return special / text.length;
}

function wordVariety(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 0);
  if (words.length <= 1) return 1;
  const unique = new Set(words);
  return unique.size / words.length;
}

function computeScore(text: string): number {
  const stripped = text.trim();
  if (stripped.length === 0) return 0;

  let score = 0;

  const vr = vowelRatio(stripped);
  if (vr < 0.15 || vr > 0.7) score += 0.3;

  const rcr = repeatedCharRatio(stripped);
  if (rcr > 0.3) score += 0.3;

  const mcc = maxConsecutiveConsonants(stripped);
  if (mcc >= 5) score += 0.25;

  const scr = specialCharRatio(stripped);
  if (scr > 0.3) score += 0.15;

  const wv = wordVariety(stripped);
  if (wv < 0.3 && stripped.split(/\s+/).length > 3) score += 0.15;

  const words = stripped.split(/\s+/);
  if (words.length === 1 && stripped.length > 10) {
    const alphaOnly = stripped.replace(/[^a-zA-Z]/g, '');
    if (alphaOnly.length > 8 && vowelRatio(alphaOnly) < 0.2) score += 0.3;
  }

  return Math.min(1, score);
}

export function gibberishDetect(options: GibberishDetectOptions): Guard {
  const threshold = options.threshold ?? 0.5;

  return {
    name: 'gibberish-detect',
    version: '0.1.0',
    description: 'Detect gibberish or nonsensical input',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const score = computeScore(text);
      const triggered = score >= threshold;

      return {
        guardName: 'gibberish-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        message: triggered
          ? `Gibberish detected (score: ${Math.round(score * 100)}%)`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              vowelRatio: vowelRatio(text),
              repeatedCharRatio: repeatedCharRatio(text),
              maxConsecutiveConsonants: maxConsecutiveConsonants(text),
              specialCharRatio: specialCharRatio(text),
              reason: 'Input appears to be random, nonsensical, or spam-like text',
            }
          : undefined,
      };
    },
  };
}
