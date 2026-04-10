import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface AgeAppropriateContentOptions { action: 'block' | 'warn'; maxGradeLevel?: number; }
const GRADE_CTX = /\b(?:(?:for\s+)?(?:1st|2nd|3rd|[4-8]th)\s+graders?|elementary|K-?12|middle\s+school|kindergarten)\b/i;
const INAPPROPRIATE = /\b(?:violen(?:ce|t)|murder|kill(?:ing)?|drugs?|cocaine|heroin|meth|explicit|sex(?:ual)?|porn|gambl(?:e|ing)|alcohol|beer|wine|liquor|cigarette|tobacco|weapon|firearm|suicide)\b/i;
function estimateGradeLevel(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const syllableCount = words.reduce((sum, w) => sum + Math.max(1, (w.match(/[aeiouy]+/gi) || []).length), 0);
  const avgSyllables = syllableCount / words.length;
  return Math.round(0.39 * avgWordsPerSentence + 11.8 * avgSyllables - 15.59);
}
export function ageAppropriateContent(options: AgeAppropriateContentOptions): Guard {
  const maxGrade = options.maxGradeLevel ?? 8;
  return { name: 'age-appropriate-content', version: '0.1.0', description: 'Enforce content filtering for K-12 audiences', category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const issues: string[] = [];
      const gradeLevel = estimateGradeLevel(text);
      if (gradeLevel > maxGrade) issues.push(`Reading level (grade ${gradeLevel}) exceeds max (grade ${maxGrade})`);
      const hasGradeCtx = GRADE_CTX.test(text);
      const hasInappropriate = INAPPROPRIATE.test(text);
      if (hasInappropriate && (hasGradeCtx || maxGrade <= 8)) issues.push('Age-inappropriate content detected for target audience');
      const triggered = issues.length > 0;
      return { guardName: 'age-appropriate-content', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? issues.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { gradeLevel, maxGradeLevel: maxGrade, issues, hasGradeContext: hasGradeCtx, hasInappropriateContent: hasInappropriate } : undefined,
      };
    },
  };
}
