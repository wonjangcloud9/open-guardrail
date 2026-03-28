import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type ExpectedFormat = 'list' | 'prose' | 'code' | 'json' | 'any';

interface InstructionFollowingOptions {
  action: 'block' | 'warn';
  expectedFormat?: ExpectedFormat;
}

function detectFormat(text: string): ExpectedFormat {
  const trimmed = text.trim();
  try { JSON.parse(trimmed); return 'json'; } catch { /* not json */ }
  if (/^```[\s\S]*```$/m.test(trimmed) || /^(import |const |let |var |def |class |function )/m.test(trimmed)) {
    return 'code';
  }
  if (/^[\s]*[-*\d][\s.)]/m.test(trimmed)) return 'list';
  return 'prose';
}

function isTooLong(text: string): boolean {
  return text.split(/\s+/).length > 500;
}

export function instructionFollowing(options: InstructionFollowingOptions): Guard {
  const expected = options.expectedFormat ?? 'any';

  return {
    name: 'instruction-following',
    version: '0.1.0',
    description: 'Checks if AI followed specific format instructions',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (expected !== 'any') {
        const actual = detectFormat(text);
        if (actual !== expected) {
          issues.push(`expected ${expected} but got ${actual}`);
        }
      }

      if (isTooLong(text)) {
        issues.push('response-too-long');
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 2, 1.0) : 0;

      return {
        guardName: 'instruction-following',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
