import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseHelpfulnessOptions {
  action: 'block' | 'warn';
}

const NON_ANSWER_PATTERNS: RegExp[] = [
  /^I\s+(don't|do not)\s+know\.?\s*$/i,
  /^I('m|\s+am)\s+not\s+sure\.?\s*$/i,
  /^I\s+cannot\s+(help|assist)\s+with\s+that\.?\s*$/i,
  /^sorry,?\s+I\s+(don't|do not)\s+have\s+(that\s+)?information/i,
  /^I\s+(don't|do not)\s+have\s+(an?\s+)?answer/i,
];

const CIRCULAR_PATTERNS: RegExp[] = [
  /as\s+(?:I\s+)?(?:just\s+)?(?:mentioned|said|stated)\s+(?:above|earlier|before)/i,
  /(?:the\s+answer\s+is\s+)?(?:that|this)\s+is\s+(?:the|a)\s+(?:question|topic)\s+(?:you|that)/i,
];

function isRestatement(text: string): boolean {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 2) return false;
  const first = sentences[0].trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const last = sentences[sentences.length - 1].trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
  if (first.length === 0 || last.length === 0) return false;
  const firstWords = new Set(first.split(/\s+/));
  const lastWords = last.split(/\s+/);
  const overlap = lastWords.filter(w => firstWords.has(w)).length;
  return overlap / Math.max(lastWords.length, 1) > 0.8;
}

export function responseHelpfulness(options: ResponseHelpfulnessOptions): Guard {
  return {
    name: 'response-helpfulness',
    version: '0.1.0',
    description: 'Scores response helpfulness and detects non-answers',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      for (const p of NON_ANSWER_PATTERNS) {
        if (p.test(text.trim())) {
          issues.push('non-answer');
          break;
        }
      }

      for (const p of CIRCULAR_PATTERNS) {
        if (p.test(text)) {
          issues.push('circular');
          break;
        }
      }

      if (isRestatement(text)) {
        issues.push('restatement');
      }

      const words = text.trim().split(/\s+/);
      if (words.length < 3 && !text.match(/^\d+$/)) {
        issues.push('too-short');
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'response-helpfulness',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
