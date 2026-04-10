import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface StudentRecordGuardOptions { action: 'block' | 'warn'; }
const STUDENT_RECORD = /\b(?:GPA|grade\s+point\s+average|transcript|student\s+ID|enrollment\s+status|disciplinary\s+record|financial\s+aid|student\s+loan|academic\s+record|test\s+scores|\w+'s\s+grades)\b/i;
const SHARE = /\b(?:share\s+with|send\s+to|post|publish|display\s+publicly|email\s+to)\b/i;
export function studentRecordGuard(options: StudentRecordGuardOptions): Guard {
  return { name: 'student-record-guard', version: '0.1.0', description: 'FERPA: prevent exposure of education records', category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const hasRecord = STUDENT_RECORD.test(text);
      const hasShare = SHARE.test(text);
      const triggered = hasRecord && hasShare;
      return { guardName: 'student-record-guard', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? 'Student record sharing detected — potential FERPA violation' : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { studentRecordDetected: hasRecord, sharingPatternDetected: hasShare, reason: 'FERPA prohibits unauthorized disclosure of student records' } : undefined,
      };
    },
  };
}
