import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ClinicalAdviceDisclaimerOptions { action: 'block' | 'warn'; }

const ADVICE_PATTERNS: RegExp[] = [
  /\byou\s+have\s+[\w\s]+(?:disease|disorder|syndrome|condition|infection|cancer)\b/gi,
  /\byour\s+diagnosis\s+is\b/gi,
  /\byou\s+should\s+take\s+\w+/gi,
  /\bincrease\s+your\s+dosage\b/gi,
  /\bstop\s+taking\s+\w+/gi,
  /\bI\s+diagnose\b/gi,
  /\btake\s+\w+\s+for\s+(?:your|the|this)\b/gi,
  /\bthis\s+treatment\s+will\s+cure\b/gi,
  /\byou\s+(?:are|have\s+been)\s+diagnosed\s+with\b/gi,
  /\bprescri(?:be|bing)\s+\w+\s+(?:for|to)\b/gi,
];

const DISCLAIMER_PATTERNS: RegExp[] = [
  /\bnot\s+medical\s+advice\b/gi,
  /\bconsult\s+(?:your\s+)?(?:doctor|physician)\b/gi,
  /\bconsult\s+a\s+healthcare\s+professional\b/gi,
  /\bfor\s+informational\s+purposes\b/gi,
  /\bseek\s+medical\s+attention\b/gi,
  /\bspeak\s+(?:with|to)\s+(?:your\s+)?(?:doctor|physician|healthcare)\b/gi,
];

export function clinicalAdviceDisclaimer(options: ClinicalAdviceDisclaimerOptions): Guard {
  return { name: 'clinical-advice-disclaimer', version: '0.1.0', description: 'Prevent unauthorized medical diagnosis/treatment advice without disclaimer', category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const adviceFound: string[] = [];
      for (const p of ADVICE_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) adviceFound.push(m[0]); }
      let hasDisclaimer = false;
      if (adviceFound.length > 0) { for (const d of DISCLAIMER_PATTERNS) { const re = new RegExp(d.source, d.flags); if (re.test(text)) { hasDisclaimer = true; break; } } }
      const triggered = adviceFound.length > 0 && !hasDisclaimer;
      return { guardName: 'clinical-advice-disclaimer', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Medical advice detected without disclaimer: "${adviceFound[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { adviceFound, reason: 'Medical advice provided without proper disclaimer' } : undefined,
      };
    },
  };
}
