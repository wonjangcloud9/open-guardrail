import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface IncidentReportTriggerOptions { action: 'block' | 'warn'; }
const INCIDENT_CATEGORIES: Record<string, RegExp[]> = {
  safety: [/\binjury\b/i, /\bharm\b/i, /\bdeath\b/i, /\bdanger\b/i, /\bemergency\b/i, /\bcritical\s+failure\b/i],
  rights: [/\bdiscrimination\b/i, /\bprivacy\s+breach\b/i, /\bunauthorized\s+access\b/i, /\bdata\s+leak\b/i],
  system: [/\bsystem\s+crash\b/i, /\bmodel\s+failure\b/i, /\bhallucination\s+confirmed\b/i, /\bincorrect\s+diagnosis\b/i, /\bwrong\s+prediction\b/i],
  regulatory: [/\bcompliance\s+violation\b/i, /\bregulatory\s+breach\b/i, /\baudit\s+failure\b/i],
};
export function incidentReportTrigger(options: IncidentReportTriggerOptions): Guard {
  return { name: 'incident-report-trigger', version: '0.1.0', description: 'Detect serious incidents requiring mandatory reporting (EU AI Act Art. 62)', category: 'compliance', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const detected: Record<string, string[]> = {};
      for (const [cat, patterns] of Object.entries(INCIDENT_CATEGORIES)) {
        const matches: string[] = [];
        for (const p of patterns) { const m = p.exec(text); if (m) matches.push(m[0]); }
        if (matches.length > 0) detected[cat] = matches;
      }
      const triggered = Object.keys(detected).length > 0;
      const categories = Object.keys(detected);
      return { guardName: 'incident-report-trigger', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Serious incident detected (${categories.join(', ')}): mandatory reporting may be required` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { incidentCategories: categories, matches: detected, reason: 'EU AI Act Art. 62 requires reporting of serious incidents' } : undefined,
      };
    },
  };
}
