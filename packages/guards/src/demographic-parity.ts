import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface DemographicParityOptions { action: 'block' | 'warn'; }
const GENDER_TERMS = /\b(he|she|they|man|woman|men|women|male|female|boys?|girls?)\b/gi;
const RACE_TERMS = /\b(white|black|asian|hispanic|latino|latina|african|caucasian|indigenous|native)\s+(people|workers?|employees?|candidates?|students?|individuals?)\b/gi;
const AGE_TERMS = /\b(young|old|older|elderly|senior|junior|millennial|boomer)\s+(people|workers?|employees?|candidates?|students?|individuals?)\b/gi;
const POSITIVE_TRAITS = /\b(logical|rational|competent|intelligent|capable|strong|leader|skilled|analytical|decisive|ambitious)\b/gi;
const NEGATIVE_TRAITS = /\b(emotional|irrational|weak|incompetent|lazy|unreliable|aggressive|submissive|hysterical|bossy|nagging)\b/gi;
const BIAS_PATTERNS: RegExp[] = [
  /\b(?:men|males?)\s+are\s+(?:more\s+)?(?:logical|rational|strong|competent|analytical)\b/i,
  /\b(?:women|females?)\s+are\s+(?:more\s+)?(?:emotional|irrational|weak|submissive|hysterical)\b/i,
  /\b(?:young\s+people|millennials?)\s+are\s+(?:more\s+)?(?:lazy|entitled|irresponsible)\b/i,
  /\b(?:old(?:er)?\s+(?:people|workers?))\s+are\s+(?:more\s+)?(?:slow|incompetent|resistant|outdated)\b/i,
  /\b(?:white|black|asian|hispanic)\s+(?:people|workers?)\s+are\s+(?:more\s+)?(?:lazy|criminal|good\s+at|bad\s+at|naturally)\b/i,
];
function detectDifferentialTreatment(text: string): { found: boolean; issues: string[] } {
  const issues: string[] = [];
  for (const p of BIAS_PATTERNS) { if (p.test(text)) issues.push(p.source); }
  const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
  for (const sentence of sentences) {
    const hasGender = GENDER_TERMS.test(sentence); GENDER_TERMS.lastIndex = 0;
    const hasRace = RACE_TERMS.test(sentence); RACE_TERMS.lastIndex = 0;
    const hasAge = AGE_TERMS.test(sentence); AGE_TERMS.lastIndex = 0;
    if (!hasGender && !hasRace && !hasAge) continue;
    const posCount = (sentence.match(POSITIVE_TRAITS) || []).length; POSITIVE_TRAITS.lastIndex = 0;
    const negCount = (sentence.match(NEGATIVE_TRAITS) || []).length; NEGATIVE_TRAITS.lastIndex = 0;
    if (posCount > 0 && negCount > 0) issues.push(`Mixed evaluative language with demographic terms: "${sentence.slice(0, 80)}"`);
    if (negCount >= 2) issues.push(`Multiple negative traits with demographic terms: "${sentence.slice(0, 80)}"`);
  }
  return { found: issues.length > 0, issues };
}
export function demographicParity(options: DemographicParityOptions): Guard {
  return { name: 'demographic-parity', version: '0.1.0', description: 'Detect demographic bias in AI outputs (Responsible AI)', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const { found: triggered, issues } = detectDifferentialTreatment(text);
      return { guardName: 'demographic-parity', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Potential demographic bias detected: ${issues.length} issue(s) found` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issueCount: issues.length, issues, reason: 'Responsible AI requires equitable treatment across demographic groups' } : undefined,
      };
    },
  };
}
