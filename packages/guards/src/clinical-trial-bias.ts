import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ClinicalTrialBiasOptions { action: 'block' | 'warn'; }

const BIAS_PATTERNS: RegExp[] = [
  /\b(?:males?\s+only|females?\s+excluded|men\s+only|women\s+excluded)\b/gi,
  /\b(?:over\s+65\s+excluded|exclude\s+(?:elderly|older\s+adults?))\b/gi,
  /\b(?:under\s+18\s+only|children\s+excluded)\b/gi,
  /\b(?:caucasian\s+only|white\s+only|excluding\s+(?:african\s+american|black|hispanic|asian|latino))\b/gi,
  /\b(?:must\s+have\s+(?:insurance|private\s+insurance|health\s+coverage))\b/gi,
  /\b(?:must\s+have\s+(?:transportation|reliable\s+transport))\b/gi,
  /\b(?:english[\s-]speaking\s+only|must\s+speak\s+english)\b/gi,
  /\b(?:no\s+physical\s+disabilities|must\s+be\s+ambulatory|wheelchair\s+users?\s+excluded)\b/gi,
  /\b(?:no\s+mental\s+health\s+(?:history|conditions?))\b/gi,
  /\b(?:must\s+(?:own|have)\s+(?:a\s+)?(?:car|vehicle|computer|smartphone))\b/gi,
];

const JUSTIFICATION_PATTERNS: RegExp[] = [
  /\bmedically?\s+(?:justified|necessary|indicated|required)\b/gi,
  /\bclinical(?:ly)?\s+(?:justified|necessary|indicated)\b/gi,
  /\breproductive\s+(?:study|health|system)\b/gi,
  /\bphysiological\s+(?:reason|basis|requirement)\b/gi,
  /\bsafety\s+(?:concern|reason|requirement|consideration)\b/gi,
];

export function clinicalTrialBias(options: ClinicalTrialBiasOptions): Guard {
  return { name: 'clinical-trial-bias', version: '0.1.0', description: 'Detect discriminatory eligibility criteria in clinical trial descriptions', category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const biasFound: string[] = [];
      for (const p of BIAS_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) biasFound.push(m[0]); }
      let hasJustification = false;
      if (biasFound.length > 0) { for (const j of JUSTIFICATION_PATTERNS) { const re = new RegExp(j.source, j.flags); if (re.test(text)) { hasJustification = true; break; } } }
      const triggered = biasFound.length > 0 && !hasJustification;
      return { guardName: 'clinical-trial-bias', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Discriminatory eligibility criteria detected: "${biasFound[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { biasFound, reason: 'Exclusion criteria without medical justification' } : undefined,
      };
    },
  };
}
