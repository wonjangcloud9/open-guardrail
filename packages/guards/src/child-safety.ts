import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface ChildSafetyOptions { action: 'block' | 'warn'; }
const CHILD_SAFETY_PATTERNS: RegExp[] = [
  /\b(?:child|minor|underage|kid|teen)\s+(?:exploitation|abuse|pornography|sexual|nude|naked)\b/gi,
  /\b(?:groom(?:ing)?|predator|pedophil)\b/gi,
  /\b(?:csam|csem|cp\b)/gi,
  /\b(?:sexual|nude|naked|explicit)\s+(?:content|images?|photos?|videos?)\s+(?:of|featuring|with)\s+(?:children|minors|kids|teens?|underage)\b/gi,
  /\b(?:lure|entice|solicit)\s+(?:a\s+)?(?:child|minor|kid|teen)\b/gi,
  /\b(?:age\s+of\s+consent|minor\s+consent)\b/gi,
];
export function childSafety(options: ChildSafetyOptions): Guard {
  return { name: 'child-safety', version: '0.1.0', description: 'Detect child exploitation and grooming patterns', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of CHILD_SAFETY_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'child-safety', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? 'Child safety violation detected' : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { reason: 'Text contains patterns associated with child exploitation or grooming' } : undefined,
      };
    },
  };
}
