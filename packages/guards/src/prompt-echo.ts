import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PromptEchoOptions {
  action: 'block' | 'warn';
}

const SYSTEM_PROMPT_PATTERNS: RegExp[] = [
  /\byou\s+are\s+(?:a|an)\s+(?:helpful|friendly|professional)\s+(?:AI|assistant|chatbot)\b/i,
  /\bsystem\s*:\s*/i,
  /\b(?:instructions?|rules?)\s*:\s*\n/i,
  /\bdo\s+not\s+(?:reveal|share|disclose)\s+(?:these?\s+)?(?:instructions?|rules?|prompt)\b/i,
  /\byour\s+(?:role|purpose|task)\s+is\s+to\b/i,
];

const ECHO_INDICATORS: RegExp[] = [
  /\b(?:here\s+(?:is|are)\s+)?(?:my|the)\s+(?:system\s+)?(?:prompt|instructions?)\b/i,
  /\b(?:as\s+)?instructed\s+in\s+(?:my|the)\s+(?:system\s+)?prompt\b/i,
  /\bmy\s+(?:original|initial)\s+(?:instructions?|programming|prompt)\b/i,
];

const USER_ECHO_PATTERNS: RegExp[] = [
  /^user\s*:\s*/im,
  /^human\s*:\s*/im,
  /\b(?:you\s+(?:asked|said|wrote))\s*:\s*["']/i,
];

export function promptEcho(options: PromptEchoOptions): Guard {
  return {
    name: 'prompt-echo',
    version: '0.1.0',
    description: 'Detects when AI echoes back the prompt verbatim',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (SYSTEM_PROMPT_PATTERNS.some((p) => p.test(text))) {
        issues.push('system_prompt_exposure');
      }
      if (ECHO_INDICATORS.some((p) => p.test(text))) {
        issues.push('instruction_echo');
      }
      if (USER_ECHO_PATTERNS.some((p) => p.test(text))) {
        issues.push('user_prompt_echo');
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'prompt-echo',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
