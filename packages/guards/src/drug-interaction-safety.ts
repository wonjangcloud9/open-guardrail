import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DrugInteractionSafetyOptions { action: 'block' | 'warn'; }

const COMBINATION_PATTERNS: RegExp[] = [
  /\btake\s+(\w+)\s+with\s+(\w+)\b/gi,
  /\bcombine\s+(\w+)\s+and\s+(\w+)\b/gi,
  /\bmix\s+(\w+)\s+with\s+(\w+)\b/gi,
  /\b(\w+)\s+(?:along|together)\s+with\s+(\w+)\b/gi,
];

const DANGEROUS_PAIRS: Array<[RegExp, RegExp]> = [
  [/\bwarfarin\b/i, /\baspirin\b/i],
  [/\bssri\b/i, /\bmaoi\b/i],
  [/\bopioid\b/i, /\bbenzodiazepine\b/i],
  [/\bmetformin\b/i, /\balcohol\b/i],
  [/\bstatin(?:s)?\b/i, /\bgrapefruit\b/i],
  [/\blithium\b/i, /\bnsaid\b/i],
];

const DOSAGE_CHANGE: RegExp[] = [
  /\bdouble\s+your\s+dose\b/gi,
  /\bincrease\s+to\s+\d+/gi,
  /\btake\s+extra\s+\w+/gi,
];

const SAFETY_WARNING: RegExp[] = [
  /\bconsult\s+(?:your\s+)?(?:doctor|physician|pharmacist)\b/gi,
  /\bunder\s+medical\s+supervision\b/gi,
  /\bmedical\s+professional\b/gi,
];

export function drugInteractionSafety(options: DrugInteractionSafetyOptions): Guard {
  return { name: 'drug-interaction-safety', version: '0.1.0', description: 'Flag potentially dangerous drug interaction statements', category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const issues: string[] = [];
      for (const p of COMBINATION_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) issues.push(m[0]); }
      for (const [a, b] of DANGEROUS_PAIRS) { if (a.test(text) && b.test(text)) issues.push(`Dangerous pair: ${a.source} + ${b.source}`); }
      for (const p of DOSAGE_CHANGE) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) issues.push(m[0]); }
      let hasSafetyWarning = false;
      if (issues.length > 0) { for (const s of SAFETY_WARNING) { const re = new RegExp(s.source, s.flags); if (re.test(text)) { hasSafetyWarning = true; break; } } }
      const triggered = issues.length > 0 && !hasSafetyWarning;
      return { guardName: 'drug-interaction-safety', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Drug interaction risk detected: "${issues[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, reason: 'Drug interaction or dosage change without safety warning' } : undefined,
      };
    },
  };
}
