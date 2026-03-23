import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface DataLeakageOptions {
  action: 'block' | 'warn';
  sensitiveStrings?: string[];
  detectSystemPrompt?: boolean;
  detectInstructions?: boolean;
}

const SYSTEM_PROMPT_PATTERNS = [
  'as an ai language model',
  'i was trained by',
  'my instructions say',
  'i am a large language model',
  'as a language model',
  'my training data',
  'my system prompt',
];

const INSTRUCTION_PATTERNS = [
  /you are a helpful assistant/i,
  /do not reveal/i,
  /you must never/i,
  /your instructions are/i,
  /system:\s*you are/i,
  /\[system\]/i,
  /<<sys>>/i,
];

export function dataLeakage(options: DataLeakageOptions): Guard {
  const detectSys = options.detectSystemPrompt ?? true;
  const detectInst = options.detectInstructions ?? true;
  const sensitive = (options.sensitiveStrings ?? []).map((s) =>
    s.toLowerCase(),
  );

  return {
    name: 'data-leakage',
    version: '0.1.0',
    description: 'Detects system prompt and data leakage',
    category: 'security',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched: string[] = [];

      if (detectSys) {
        for (const p of SYSTEM_PROMPT_PATTERNS) {
          if (lower.includes(p)) matched.push(p);
        }
      }

      if (detectInst) {
        for (const rx of INSTRUCTION_PATTERNS) {
          if (rx.test(text)) {
            matched.push(rx.source);
          }
        }
      }

      for (const s of sensitive) {
        if (lower.includes(s)) {
          matched.push(s);
        }
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'data-leakage',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedPatterns: matched }
          : undefined,
      };
    },
  };
}
