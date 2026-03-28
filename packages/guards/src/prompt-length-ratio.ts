import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PromptLengthRatioOptions {
  action: 'block' | 'warn';
  typicalMinLength?: number;
  typicalMaxLength?: number;
}

export function promptLengthRatio(options: PromptLengthRatioOptions): Guard {
  const minLen = options.typicalMinLength ?? 10;
  const maxLen = options.typicalMaxLength ?? 2000;

  return {
    name: 'prompt-length-ratio',
    version: '0.1.0',
    description: 'Checks input length ratio vs typical queries for anomaly detection',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const len = text.length;
      const issues: string[] = [];

      if (len > maxLen) {
        const ratio = len / maxLen;
        issues.push(`input_too_long:${ratio.toFixed(1)}x`);
      }

      if (len < minLen && len > 0) {
        issues.push('input_suspiciously_short');
      }

      if (len === 0) {
        issues.push('empty_input');
      }

      const paddingRatio = (text.match(/\s/g) ?? []).length / Math.max(len, 1);
      if (paddingRatio > 0.7 && len > 100) {
        issues.push('excessive_whitespace_padding');
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 2, 1.0) : 0;

      return {
        guardName: 'prompt-length-ratio',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, inputLength: len } : undefined,
      };
    },
  };
}
