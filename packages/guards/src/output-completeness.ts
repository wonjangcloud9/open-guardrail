import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface OutputCompletenessOptions {
  action: 'block' | 'warn';
}

const CONTINUATION_PATTERNS = [
  /I'?ll\s+continue\s+in\s+the\s+next\s+message/i,
  /to\s+be\s+continued/i,
  /continued\s+in\s+(part|next)/i,
  /see\s+part\s+\d+\s+for\s+the\s+rest/i,
  /I'?ll\s+finish\s+this\s+in/i,
];

const INCOMPLETE_LIST_RE = /(?:^|\n)\s*(?:\d+\.|[-*])\s+\S.*(?:\n\s*(?:\d+\.|[-*])\s+\S.*)*\s*$/;
const MID_SENTENCE_RE = /[a-zA-Z,]\s*$/;
const UNCLOSED_TAG_RE = /<(\w+)[^>]*>(?:(?!<\/\1>).)*$/s;

export function outputCompleteness(options: OutputCompletenessOptions): Guard {
  return {
    name: 'output-completeness',
    version: '0.1.0',
    description: 'Checks if AI output appears complete',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const trimmed = text.trim();

      if (!trimmed) {
        return {
          guardName: 'output-completeness',
          passed: true,
          action: 'allow',
          score: 0,
          latencyMs: Math.round(performance.now() - start),
        };
      }

      for (const p of CONTINUATION_PATTERNS) {
        if (p.test(trimmed)) {
          issues.push('continuation_phrase');
          break;
        }
      }

      if (MID_SENTENCE_RE.test(trimmed) && trimmed.length > 20) {
        const lastChar = trimmed[trimmed.length - 1];
        if (!['.', '!', '?', ':', ';', ')', ']', '}', '"', "'", '`'].includes(lastChar)) {
          issues.push('mid_sentence_cutoff');
        }
      }

      if (UNCLOSED_TAG_RE.test(trimmed)) {
        issues.push('unclosed_tag');
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'output-completeness',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(issues.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
