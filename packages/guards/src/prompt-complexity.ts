import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PromptComplexityOptions {
  action: 'block' | 'warn';
  maxComplexityScore?: number;
}

function countNesting(text: string): number {
  let max = 0;
  let depth = 0;
  for (const ch of text) {
    if ('([{'.includes(ch)) { depth++; max = Math.max(max, depth); }
    if (')]}'.includes(ch)) { depth = Math.max(0, depth - 1); }
  }
  return max;
}

function specialCharRatio(text: string): number {
  if (text.length === 0) return 0;
  const specials = text.replace(/[a-zA-Z0-9\s]/g, '').length;
  return specials / text.length;
}

function punctuationDensity(text: string): number {
  if (text.length === 0) return 0;
  const puncts = (text.match(/[!?.,;:'"@#$%^&*(){}[\]<>]/g) || []).length;
  return puncts / text.length;
}

function mixedScripts(text: string): number {
  const latin = /[a-zA-Z]/.test(text);
  const cyrillic = /[\u0400-\u04FF]/.test(text);
  const cjk = /[\u4E00-\u9FFF\u3040-\u30FF]/.test(text);
  const arabic = /[\u0600-\u06FF]/.test(text);
  const count = [latin, cyrillic, cjk, arabic].filter(Boolean).length;
  return count > 1 ? (count - 1) * 0.3 : 0;
}

function unusualWhitespace(text: string): number {
  const unusual = (text.match(/[\t\v\f\r\u00A0\u2000-\u200B\u3000]/g) || []).length;
  return Math.min(unusual / Math.max(text.length, 1) * 10, 1);
}

export function promptComplexity(options: PromptComplexityOptions): Guard {
  const threshold = options.maxComplexityScore ?? 0.7;

  return {
    name: 'prompt-complexity',
    version: '0.1.0',
    description: 'Detects overly complex prompts that may be adversarial',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      const nestScore = Math.min(countNesting(text) / 10, 1);
      const specScore = specialCharRatio(text);
      const punctScore = punctuationDensity(text);
      const scriptScore = mixedScripts(text);
      const wsScore = unusualWhitespace(text);

      const score = (nestScore * 0.25) + (specScore * 0.25) +
        (punctScore * 0.2) + (scriptScore * 0.15) + (wsScore * 0.15);

      const triggered = score >= threshold;

      return {
        guardName: 'prompt-complexity',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: Math.round(score * 1000) / 1000,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? {
          nestingDepth: countNesting(text),
          specialCharRatio: Math.round(specScore * 100) / 100,
          punctuationDensity: Math.round(punctScore * 100) / 100,
        } : undefined,
      };
    },
  };
}
