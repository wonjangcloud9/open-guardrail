import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface StereotypeAssociationOptions { action: 'block' | 'warn'; }

const GENDER_OCC: RegExp[] = [
  /\b(?:female|woman|women|girl)\s+(?:nurse|secretary|teacher|maid|receptionist|housekeeper)\b/gi,
  /\b(?:male|man|men|boy)\s+(?:engineer|programmer|ceo|surgeon|pilot|scientist)\b/gi,
  /\b(?:women|girls)\s+(?:should|need\s+to|belong|must)\s+(?:stay\s+(?:home|at\s+home)|cook|clean|be\s+(?:quiet|submissive))\b/gi,
  /\b(?:men|boys)\s+(?:don'?t|shouldn'?t|should\s+not|never)\s+(?:cry|show\s+emotion|be\s+(?:weak|sensitive))\b/gi,
  /\b(?:real\s+(?:men|women))\s+(?:don'?t|always|should|never)\b/gi,
];

const RACE_TRAIT: RegExp[] = [
  /\b(?:blacks?|african\s*americans?)\s+(?:are|tend\s+to\s+be)\s+(?:lazy|violent|criminal|aggressive|athletic|good\s+at\s+sports)\b/gi,
  /\b(?:asians?|chinese|japanese|korean|indian)\s+(?:are|tend\s+to\s+be)\s+(?:good\s+at\s+math|smart|nerdy|quiet|submissive|sneaky)\b/gi,
  /\b(?:whites?|caucasians?)\s+(?:are|tend\s+to\s+be)\s+(?:superior|smarter|more\s+civilized)\b/gi,
  /\b(?:hispanics?|latinos?|latinas?|mexicans?)\s+(?:are|tend\s+to\s+be)\s+(?:lazy|illegal|uneducated|criminal)\b/gi,
];

const AGE_CAP: RegExp[] = [
  /\b(?:too\s+old\s+to)\s+(?:learn|change|understand|adapt|work)\b/gi,
  /\b(?:millennials?|gen\s*z)\s+(?:are|all)\s+(?:lazy|entitled|narcissistic|snowflakes?)\b/gi,
  /\b(?:boomers?|old\s+people)\s+(?:don'?t|can'?t|won'?t|refuse\s+to)\s+(?:understand|learn|adapt|use)\s+(?:technology|tech|computers?|internet)\b/gi,
];

const NATIONALITY: RegExp[] = [
  /\b(?:all|every)\s+(?:americans?|french|germans?|russians?|chinese|indians?|japanese|arabs?|africans?|british|italians?)\s+(?:are|love|hate|always)\b/gi,
];

const ALL_PATTERNS = [...GENDER_OCC, ...RACE_TRAIT, ...AGE_CAP, ...NATIONALITY];

export function stereotypeAssociation(options: StereotypeAssociationOptions): Guard {
  return { name: 'stereotype-association', version: '0.1.0', description: 'Detect stereotype associations between groups and roles/traits', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of ALL_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'stereotype-association', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Stereotype association detected: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains stereotypical associations between groups and traits/roles' } : undefined,
      };
    },
  };
}
