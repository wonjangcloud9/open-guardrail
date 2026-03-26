import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface LegalAdviceOptions {
  action: 'block' | 'warn';
}

const LEGAL_PATTERNS: RegExp[] = [
  /\byou\s+(?:should|can|could|need to)\s+(?:sue|file\s+a\s+lawsuit|press\s+charges|take\s+legal\s+action)\b/gi,
  /\b(?:legally|under\s+the\s+law)\s+(?:you\s+are|they\s+are|it\s+is)\s+(?:required|obligated|entitled)\b/gi,
  /\byour?\s+(?:rights|obligations|liabilities)\s+(?:include|are|under)\b/gi,
  /\b(?:this\s+constitutes|that\s+is)\s+(?:breach\s+of\s+contract|negligence|fraud|defamation|harassment)\b/gi,
  /\b(?:plead|claim)\s+(?:guilty|not guilty|innocen(?:t|ce))\b/gi,
  /\b(?:statute\s+of\s+limitations|legal\s+precedent|case\s+law)\s+(?:says|states|indicates)\b/gi,
  /\b(?:I|we)\s+(?:advise|recommend|suggest)\s+(?:you\s+)?(?:consult|hire|retain)\s+(?:a\s+)?(?:lawyer|attorney)\b/gi,
];

export function legalAdvice(options: LegalAdviceOptions): Guard {
  return {
    name: 'legal-advice',
    version: '0.1.0',
    description: 'Detect unauthorized legal advice in LLM responses',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of LEGAL_PATTERNS) {
        const re = new RegExp(p.source, p.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0]);
      }
      const triggered = matched.length > 0;
      return {
        guardName: 'legal-advice',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `Legal advice detected: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'LLM should not provide specific legal advice without disclaimers' } : undefined,
      };
    },
  };
}
