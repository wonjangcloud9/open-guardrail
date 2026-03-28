import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface BulletConsistencyOptions {
  action: 'block' | 'warn';
}

export function bulletConsistency(options: BulletConsistencyOptions): Guard {
  return {
    name: 'bullet-consistency',
    version: '0.1.0',
    description: 'Checks bullet point consistency',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const bulletPattern = /^(\s*)([-*+])\s/gm;
      const styles = new Set<string>();
      const bullets: Array<{ indent: number; style: string; line: number }> = [];
      let match: RegExpExecArray | null;
      let lineNum = 0;

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^(\s*)([-*+])\s/);
        if (m) {
          styles.add(m[2]);
          bullets.push({ indent: m[1].length, style: m[2], line: i + 1 });
        }
      }

      if (styles.size > 1) {
        issues.push(`Mixed bullet styles: ${[...styles].join(', ')}`);
      }

      for (let i = 0; i < bullets.length; i++) {
        if (i === 0 && bullets[i].indent > 0) {
          issues.push(`Orphaned sub-bullet at line ${bullets[i].line}`);
        } else if (i > 0 && bullets[i].indent > bullets[i - 1].indent + 4) {
          issues.push(`Excessive indent jump at line ${bullets[i].line}`);
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'bullet-consistency',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, stylesFound: [...styles] } : undefined,
      };
    },
  };
}
