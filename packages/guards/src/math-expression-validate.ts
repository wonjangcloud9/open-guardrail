import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MathExpressionValidateOptions {
  action: 'block' | 'warn';
}

export function mathExpressionValidate(options: MathExpressionValidateOptions): Guard {
  return {
    name: 'math-expression-validate',
    version: '0.1.0',
    description: 'Validates mathematical expressions',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      const mathBlocks = text.match(/\$[^$]+\$|\\\(.*?\\\)|\\\[.*?\\\]/g) ?? [];
      const inlineExpr = text.match(/(?<!\w)[\d(][^a-zA-Z\n]*[+\-*/^=][^a-zA-Z\n]*[\d)]/g) ?? [];
      const expressions = [...mathBlocks, ...inlineExpr];

      for (const expr of expressions) {
        let depth = 0;
        for (const ch of expr) {
          if (ch === '(' || ch === '[' || ch === '{') depth++;
          if (ch === ')' || ch === ']' || ch === '}') depth--;
          if (depth < 0) {
            issues.push(`Unbalanced parentheses in: ${expr.slice(0, 40)}`);
            break;
          }
        }
        if (depth > 0) {
          issues.push(`Unclosed parenthesis in: ${expr.slice(0, 40)}`);
        }

        if (/[+\-*/^]{2,}/.test(expr.replace(/\*\*/g, '').replace(/\+\+/g, '').replace(/--/g, ''))) {
          issues.push(`Invalid operator sequence in: ${expr.slice(0, 40)}`);
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'math-expression-validate',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
