import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface FerpaDetectOptions {
  action: 'block' | 'warn';
  /** Check for student ID patterns (default true) */
  checkStudentId?: boolean;
}

const GRADE_PATTERNS: RegExp[] = [
  /\b(?:student|pupil)(?:'s)?\s+(?:grade|gpa|score|marks?|transcript)/i,
  /\b(?:grade|gpa|score)\s*[:=]\s*[A-F0-9][+-]?\b/i,
  /\bgpa\s*(?:of|is|was|[:=])\s*[0-4]\.\d+/i,
  /\b(?:report\s+card|academic\s+record|transcript)\s+(?:for|of)\b/i,
];

const DISCIPLINARY_PATTERNS: RegExp[] = [
  /\b(?:disciplinary|suspension|expulsion)\s+(?:record|action|hearing|report)/i,
  /\b(?:student|pupil)\s+(?:was|has\s+been)\s+(?:suspended|expelled|disciplined)/i,
  /\b(?:behavior|conduct)\s+(?:report|violation|incident)\s+(?:for|of)\s+(?:student|pupil)/i,
];

const ENROLLMENT_PATTERNS: RegExp[] = [
  /\b(?:enrollment|enrolment)\s+(?:status|record|date)\s+(?:for|of)\b/i,
  /\b(?:student|pupil)\s+(?:is|was)\s+(?:enrolled|registered|withdrawn|transferred)/i,
  /\b(?:attendance\s+record|class\s+schedule)\s+(?:for|of)\s+(?:student|pupil)/i,
];

const EDUCATION_RECORD_PATTERNS: RegExp[] = [
  /\b(?:education|school)\s+records?\s+(?:for|of|show)/i,
  /\b(?:student|pupil)(?:'s)?\s+(?:address|phone|parent|guardian|date\s+of\s+birth|social\s+security)/i,
  /\b(?:special\s+education|IEP|504\s+plan|learning\s+disabilit)/i,
];

const STUDENT_ID_PATTERN = /\b(?:student\s*(?:id|number|#|no))\s*[:=]?\s*[A-Z0-9]{5,12}\b/gi;

export function ferpaDetect(options: FerpaDetectOptions): Guard {
  const shouldCheckId = options.checkStudentId ?? true;

  return {
    name: 'ferpa-detect',
    version: '0.1.0',
    description: 'Detects FERPA violations related to student education records privacy',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];

      for (const p of GRADE_PATTERNS) {
        if (p.test(text)) { violations.push('grade_data'); break; }
      }
      for (const p of DISCIPLINARY_PATTERNS) {
        if (p.test(text)) { violations.push('disciplinary_record'); break; }
      }
      for (const p of ENROLLMENT_PATTERNS) {
        if (p.test(text)) { violations.push('enrollment_status'); break; }
      }
      for (const p of EDUCATION_RECORD_PATTERNS) {
        if (p.test(text)) { violations.push('education_record'); break; }
      }
      if (shouldCheckId) {
        STUDENT_ID_PATTERN.lastIndex = 0;
        if (STUDENT_ID_PATTERN.test(text)) violations.push('student_id');
        STUDENT_ID_PATTERN.lastIndex = 0;
      }

      const triggered = violations.length > 0;
      const score = triggered ? Math.min(violations.length / 3, 1.0) : 0;

      return {
        guardName: 'ferpa-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations } : undefined,
      };
    },
  };
}
