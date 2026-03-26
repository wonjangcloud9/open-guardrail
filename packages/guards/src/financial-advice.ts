import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface FinancialAdviceOptions {
  action: 'block' | 'warn';
}

const FINANCIAL_PATTERNS: RegExp[] = [
  /\b(?:you\s+should|I\s+recommend|I\s+advise)\s+(?:buy|sell|invest|short|hold)\s+/gi,
  /\b(?:guaranteed|certain|sure)\s+(?:to\s+)?(?:profit|return|gain|make money)\b/gi,
  /\b(?:invest|put)\s+(?:all|your)\s+(?:money|savings|retirement|401k)\s+(?:in|into)\b/gi,
  /\b(?:this|that)\s+(?:stock|crypto|coin|token|fund|ETF)\s+will\s+(?:go up|moon|skyrocket|double|triple)\b/gi,
  /\b(?:financial|investment|tax)\s+advice\b/gi,
  /\b(?:buy|sell)\s+(?:now|immediately|ASAP|before it's too late)\b/gi,
  /\bnot\s+financial\s+advice\b/gi,
];

export function financialAdvice(options: FinancialAdviceOptions): Guard {
  return {
    name: 'financial-advice',
    version: '0.1.0',
    description: 'Detect unauthorized financial/investment advice',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of FINANCIAL_PATTERNS) {
        const re = new RegExp(p.source, p.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0]);
      }
      const triggered = matched.length > 0;
      return {
        guardName: 'financial-advice',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `Financial advice detected: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'LLM should not provide specific financial/investment advice' } : undefined,
      };
    },
  };
}
