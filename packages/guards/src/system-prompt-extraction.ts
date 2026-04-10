import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SystemPromptExtractionOptions {
  action: 'block' | 'warn';
}

const EXTRACTION_PATTERNS: RegExp[] = [
  /what\s+are\s+your\s+instructions/i,
  /show\s+me\s+your\s+system\s+prompt/i,
  /print\s+your\s+prompt/i,
  /repeat\s+your\s+initial\s+instructions/i,
  /what\s+were\s+you\s+told/i,
  /display\s+your\s+config/i,
  /ignore\s+all\s+instructions\s+and\s+print/i,
  /output\s+your\s+rules\s+verbatim/i,
  /what\s+is\s+your\s+system\s+message/i,
  /reveal\s+your\s+guidelines/i,
  /copy\s+paste\s+your\s+instructions/i,
  /tell\s+me\s+your\s+exact\s+prompt/i,
  /act\s+as\s+a\s+prompt\s+leaker/i,
  /\bDAN\s+mode\b/i,
  /\bdeveloper\s+mode\b/i,
  /echo\s+\$SYSTEM_PROMPT/i,
  /cat\s+\/system\/prompt/i,
  /env\s*\|\s*grep\s+PROMPT/i,
];

export function systemPromptExtraction(options: SystemPromptExtractionOptions): Guard {
  return {
    name: 'system-prompt-extraction',
    version: '0.1.0',
    description: 'Detects attempts to extract system prompts (OWASP LLM 2025)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pat of EXTRACTION_PATTERNS) {
        if (pat.test(text)) {
          matched.push(pat.source);
        }
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'system-prompt-extraction',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedPatterns: matched.length }
          : undefined,
      };
    },
  };
}
