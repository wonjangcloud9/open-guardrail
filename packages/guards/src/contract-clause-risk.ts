import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ContractClauseRiskOptions {
  action: 'block' | 'warn';
}

interface RiskClause {
  category: string;
  pattern: RegExp;
  risk: 'high' | 'medium';
}

const RISK_CLAUSES: RiskClause[] = [
  { category: 'unlimited-liability', pattern: /\bunlimited\s+liability\b/i, risk: 'high' },
  { category: 'unlimited-liability', pattern: /\bno\s+cap\s+on\s+damages\b/i, risk: 'high' },
  { category: 'unlimited-liability', pattern: /\bunlimited\s+indemnification\b/i, risk: 'high' },
  { category: 'auto-renewal', pattern: /\bauto[- ]?renewal\b/i, risk: 'medium' },
  { category: 'auto-renewal', pattern: /\bautomatically\s+renew\b/i, risk: 'medium' },
  { category: 'auto-renewal', pattern: /\bevergreen\s+clause\b/i, risk: 'medium' },
  { category: 'unilateral-termination', pattern: /\bterminate\s+at\s+will\b/i, risk: 'high' },
  { category: 'unilateral-termination', pattern: /\bterminate\s+without\s+cause\b/i, risk: 'high' },
  { category: 'unilateral-termination', pattern: /\bsole\s+discretion\s+to\s+terminate\b/i, risk: 'high' },
  { category: 'waiver-of-rights', pattern: /\bwaive\s+all\s+rights\b/i, risk: 'high' },
  { category: 'waiver-of-rights', pattern: /\bwaive\s+right\s+to\s+sue\b/i, risk: 'high' },
];

function checkNonCompete(text: string): RiskClause | null {
  if (!/\bnon[- ]?compete\b/i.test(text)) return null;
  const broad = /\b(?:worldwide|perpetual|indefinite|all\s+industries)\b/i;
  if (broad.test(text)) {
    return { category: 'non-compete-broad', pattern: broad, risk: 'high' };
  }
  return null;
}

function checkArbitrationWaiver(text: string): RiskClause | null {
  if (!/\bmandatory\s+arbitration\b/i.test(text)) return null;
  if (/\bwaive\s+jury\b/i.test(text)) {
    return { category: 'mandatory-arbitration-jury-waiver', pattern: /waive jury/i, risk: 'high' };
  }
  return null;
}

function checkIpAssignment(text: string): RiskClause | null {
  const ipBroad = /\b(?:all\s+intellectual\s+property|assign\s+all\s+IP)\b/i.test(text);
  const workForHire = /\bwork\s+for\s+hire\b/i.test(text) && /\bperpetual\b/i.test(text);
  if (ipBroad || workForHire) {
    return { category: 'ip-assignment-broad', pattern: /all intellectual property/i, risk: 'high' };
  }
  return null;
}

export function contractClauseRisk(options: ContractClauseRiskOptions): Guard {
  return {
    name: 'contract-clause-risk',
    version: '0.1.0',
    description: 'Flag high-risk contract clauses in generated legal text',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const found: { category: string; risk: string; match: string }[] = [];
      for (const rc of RISK_CLAUSES) {
        const m = rc.pattern.exec(text);
        if (m) found.push({ category: rc.category, risk: rc.risk, match: m[0] });
      }
      const nc = checkNonCompete(text);
      if (nc) found.push({ category: nc.category, risk: nc.risk, match: 'non-compete + broad scope' });
      const aw = checkArbitrationWaiver(text);
      if (aw) found.push({ category: aw.category, risk: aw.risk, match: 'mandatory arbitration + jury waiver' });
      const ip = checkIpAssignment(text);
      if (ip) found.push({ category: ip.category, risk: ip.risk, match: 'broad IP assignment' });
      const triggered = found.length > 0;
      return {
        guardName: 'contract-clause-risk',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `${found.length} risky clause(s) detected: ${found.map((f) => f.category).join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { riskyClauses: found } : undefined,
      };
    },
  };
}
