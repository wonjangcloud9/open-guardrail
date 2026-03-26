import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface SpamDetectOptions { action: 'block' | 'warn'; threshold?: number; }
export function spamDetect(options: SpamDetectOptions): Guard {
  const threshold = options.threshold ?? 0.5;
  return { name: 'spam-detect', version: '0.1.0', description: 'Detect spam patterns (caps, repetition, excessive punctuation)', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); let score = 0; const signals: string[] = [];
      const upper = [...text].filter(c => /[A-Z]/.test(c)).length;
      const alpha = [...text].filter(c => /[a-zA-Z]/.test(c)).length;
      if (alpha > 10 && upper / alpha > 0.7) { score += 0.3; signals.push('excessive-caps'); }
      if (/(.)\1{4,}/.test(text)) { score += 0.2; signals.push('repeated-chars'); }
      if (/[!?]{3,}/.test(text)) { score += 0.2; signals.push('excessive-punctuation'); }
      if (/\b(?:BUY NOW|FREE|CLICK HERE|ACT NOW|LIMITED TIME|WINNER|CONGRATULATIONS)\b/i.test(text)) { score += 0.3; signals.push('spam-keywords'); }
      const words = text.toLowerCase().split(/\s+/); const unique = new Set(words);
      if (words.length > 10 && unique.size / words.length < 0.3) { score += 0.2; signals.push('low-vocabulary'); }
      if (/https?:\/\/[^\s]+/g.test(text) && (text.match(/https?:\/\//g)?.length ?? 0) > 3) { score += 0.2; signals.push('many-links'); }
      const triggered = score >= threshold;
      return { guardName: 'spam-detect', passed: !triggered, action: triggered ? options.action : 'allow', score: Math.min(1, score),
        message: triggered ? `Spam detected (${Math.round(score * 100)}%): ${signals.join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { signals, score: Math.min(1, score), reason: 'Text has spam-like characteristics' } : undefined,
      };
    },
  };
}
