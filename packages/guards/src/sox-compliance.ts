import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SoxComplianceOptions {
  action: 'block' | 'warn';
  extraPatterns?: RegExp[];
}

const DEFAULT_PATTERNS: RegExp[] = [
  /alter\s+financial\s+records/i,
  /backdate\s+(the\s+)?(documents?|records?|reports?|entries|transactions?)/i,
  /cook\s+the\s+books/i,
  /hide\s+(the\s+)?losses/i,
  /off[- ]balance[- ]sheet/i,
  /inflate\s+(the\s+)?revenue/i,
  /manipulat(e|ing)\s+(financial|accounting)\s+(data|records?|statements?)/i,
  /falsif(y|ying)\s+(financial|audit)\s+(reports?|records?|data)/i,
  /tamper(ing)?\s+with\s+(the\s+)?(audit\s+trail|audit\s+log|financial\s+records?)/i,
  /unauthorized\s+access\s+to\s+financial\s+(records?|systems?|data)/i,
  /destroy(ing)?\s+(audit|financial)\s+(trail|logs?|records?|evidence)/i,
  /circumvent(ing)?\s+internal\s+controls/i,
  /misrepresent(ing)?\s+financial\s+(position|status|results?)/i,
  /conceal(ing)?\s+(debts?|liabilit(y|ies)|losses|expenses?)/i,
];

export function soxCompliance(options: SoxComplianceOptions): Guard {
  const patterns = [...DEFAULT_PATTERNS, ...(options.extraPatterns ?? [])];

  return {
    name: 'sox-compliance',
    version: '0.1.0',
    description: 'Detects Sarbanes-Oxley compliance violations and financial manipulation language',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of patterns) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'sox-compliance',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
