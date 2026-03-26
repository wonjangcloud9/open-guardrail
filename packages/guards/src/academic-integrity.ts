import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface AcademicIntegrityOptions { action: 'block' | 'warn'; }
const ACADEMIC_PATTERNS: RegExp[] = [
  /\b(?:write|do|complete)\s+(?:my|this|the)\s+(?:essay|homework|assignment|thesis|dissertation|paper)\s+(?:for me|instead)\b/gi,
  /\b(?:take|do)\s+(?:my|this)\s+(?:exam|test|quiz)\b/gi,
  /\b(?:essay\s+(?:mill|writing\s+service)|buy\s+(?:an?\s+)?(?:essay|paper|thesis))\b/gi,
  /\b(?:plagiari[sz]e|copy\s+(?:this|and\s+paste)|submit\s+as\s+(?:my|your)\s+own)\b/gi,
  /\b(?:cheat(?:ing)?\s+(?:on|in|at)\s+(?:the|my|an?))\b/gi,
  /\b(?:ghost\s*writ(?:e|ing|er))\b/gi,
];
export function academicIntegrity(options: AcademicIntegrityOptions): Guard {
  return { name: 'academic-integrity', version: '0.1.0', description: 'Detect academic dishonesty requests (essay mills, cheating)', category: 'content', supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of ACADEMIC_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'academic-integrity', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Academic integrity concern: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Request may involve academic dishonesty' } : undefined,
      };
    },
  };
}
