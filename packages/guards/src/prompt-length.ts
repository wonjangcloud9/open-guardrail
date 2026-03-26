import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PromptLengthOptions { action: 'block' | 'warn'; maxChars?: number; maxWords?: number; maxLines?: number; }

export function promptLength(options: PromptLengthOptions): Guard {
  return { name: 'prompt-length', version: '0.1.0', description: 'Validate input prompt length (chars/words/lines)', category: 'format', supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const violations: string[] = [];
      if (options.maxChars && text.length > options.maxChars) violations.push(`${text.length} chars (max: ${options.maxChars})`);
      if (options.maxWords) { const words = text.split(/\s+/).filter(w => w.length > 0).length; if (words > options.maxWords) violations.push(`${words} words (max: ${options.maxWords})`); }
      if (options.maxLines) { const lines = text.split('\n').length; if (lines > options.maxLines) violations.push(`${lines} lines (max: ${options.maxLines})`); }
      const triggered = violations.length > 0;
      return { guardName: 'prompt-length', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Prompt too long: ${violations.join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations, reason: 'Input prompt exceeds length limits' } : undefined,
      };
    },
  };
}
