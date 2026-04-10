import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MentalHealthCrisisOptions { action: 'block' | 'warn'; }

const CRISIS_PATTERNS: RegExp[] = [
  /\bwant\s+to\s+die\b/gi,
  /\bkill\s+myself\b/gi,
  /\bend\s+my\s+life\b/gi,
  /\bsuicid(?:e|al\s+thoughts?)\b/gi,
  /\bnot\s+worth\s+living\b/gi,
  /\bbetter\s+off\s+dead\b/gi,
  /\bcut\s+myself\b/gi,
  /\bhurt\s+myself\b/gi,
  /\bself[\s-]harm\b/gi,
  /\bself[\s-]injury\b/gi,
  /\bcan'?t\s+go\s+on\b/gi,
  /\bno\s+way\s+out\b/gi,
  /\bno\s+hope\b/gi,
  /\bnobody\s+cares?\b/gi,
  /\bworld\s+would\s+be\s+better\s+without\s+me\b/gi,
  /\bdon'?t\s+want\s+to\s+(?:be\s+)?(?:alive|exist|live)\b/gi,
  /\btaking\s+my\s+(?:own\s+)?life\b/gi,
];

export function mentalHealthCrisis(options: MentalHealthCrisisOptions): Guard {
  return { name: 'mental-health-crisis', version: '0.1.0', description: 'Detect mental health crisis language and ensure proper routing', category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of CRISIS_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'mental-health-crisis', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? 'Mental health crisis language detected — include crisis resources' : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, crisisResources: ['988 Suicide & Crisis Lifeline: call or text 988', 'Crisis Text Line: text HOME to 741741'], reason: 'Text contains mental health crisis indicators' } : undefined,
      };
    },
  };
}
