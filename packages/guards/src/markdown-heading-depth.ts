import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MarkdownHeadingDepthOptions {
  action: 'block' | 'warn';
  maxDepth?: number;
}

export function markdownHeadingDepth(options: MarkdownHeadingDepthOptions): Guard {
  const maxDepth = options.maxDepth ?? 4;

  return {
    name: 'markdown-heading-depth',
    version: '0.1.0',
    description: 'Validates markdown heading hierarchy',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const headingPattern = /^(#{1,6})\s/gm;
      const levels: number[] = [];
      let match: RegExpExecArray | null;

      while ((match = headingPattern.exec(text)) !== null) {
        levels.push(match[1].length);
      }

      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) {
          issues.push(`Skipped from h${levels[i - 1]} to h${levels[i]}`);
        }
      }

      for (const level of levels) {
        if (level > maxDepth) {
          issues.push(`Heading depth ${level} exceeds max ${maxDepth}`);
          break;
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'markdown-heading-depth',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
