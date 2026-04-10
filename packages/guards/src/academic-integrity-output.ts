import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface AcademicIntegrityOutputOptions { action: 'block' | 'warn'; }
const ASSIGN_REQ = /\b(?:write\s+my\s+essay|do\s+my\s+homework|solve\s+this\s+exam|answer\s+these\s+test\s+questions|complete\s+this\s+assignment)\b/i;
const COMPLETION = /\b(?:here\s+is\s+your\s+completed\s+assignment|here\s+is\s+the\s+essay|I've\s+written\s+the\s+paper|\/\/\s*Solution:|def\s+solution\(|Answer:\s*[A-E]|The\s+correct\s+answer\s+is)\b/i;
const EDU_FRAME = /\b(?:here'?s?\s+how\s+to\s+approach|let\s+me\s+explain\s+the\s+concept|step[- ]by[- ]step\s+guide|learning\s+objective)\b/i;
export function academicIntegrityOutput(options: AcademicIntegrityOutputOptions): Guard {
  return { name: 'academic-integrity-output', version: '0.1.0', description: 'Prevent AI from completing academic assignments', category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const hasAssignment = ASSIGN_REQ.test(text);
      const hasCompletion = COMPLETION.test(text);
      const hasEduFrame = EDU_FRAME.test(text);
      const triggered = (hasAssignment || hasCompletion) && !hasEduFrame;
      return { guardName: 'academic-integrity-output', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? 'Academic assignment completion detected without educational framing' : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { assignmentRequest: hasAssignment, completionDetected: hasCompletion, educationalFraming: hasEduFrame } : undefined,
      };
    },
  };
}
