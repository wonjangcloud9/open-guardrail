import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DataResidencyOptions {
  action: 'block' | 'warn';
  allowedRegions: string[];
}

const REGION_PATTERNS: { region: string; re: RegExp }[] = [
  { region: 'us-east-1', re: /us-east-1/i },
  { region: 'us-west-2', re: /us-west-2/i },
  { region: 'eu-west-1', re: /eu-west-1/i },
  { region: 'eu-central-1', re: /eu-central-1/i },
  { region: 'ap-northeast-1', re: /ap-northeast-1/i },
  { region: 'ap-southeast-1', re: /ap-southeast-1/i },
  { region: 'ap-northeast-2', re: /ap-northeast-2/i },
  { region: 'us-east', re: /\bus[- ]east\b/i },
  { region: 'us-west', re: /\bus[- ]west\b/i },
  { region: 'europe', re: /\beurope\b/i },
  { region: 'asia-pacific', re: /\basia[- ]pacific\b/i },
];

const CROSS_BORDER_PATTERNS = [
  /transfer\s+(data\s+)?(to|from)\s+(another\s+)?(country|region|jurisdiction)/i,
  /cross[- ]border\s+(data|transfer)/i,
  /data\s+center\s+in\s+\w+/i,
  /store[ds]?\s+(in|at)\s+(a\s+)?\w+\s+data\s*cent/i,
];

export function dataResidency(options: DataResidencyOptions): Guard {
  const allowed = new Set(options.allowedRegions.map((r) => r.toLowerCase()));

  return {
    name: 'data-residency',
    version: '0.1.0',
    description: 'Detects data residency violations based on region policy',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      for (const rp of REGION_PATTERNS) {
        if (rp.re.test(text) && !allowed.has(rp.region.toLowerCase())) {
          issues.push(`disallowed_region:${rp.region}`);
        }
      }

      for (const pat of CROSS_BORDER_PATTERNS) {
        if (pat.test(text)) {
          issues.push('cross_border_reference');
          break;
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'data-residency',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
