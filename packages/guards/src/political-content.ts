import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface PoliticalContentOptions { action: 'block' | 'warn'; }
const POLITICAL_PATTERNS: RegExp[] = [
  /\b(?:vote\s+(?:for|against)|campaign\s+(?:for|against)|political\s+(?:party|candidate|election))\b/gi,
  /\b(?:republican|democrat|conservative|liberal|left[- ]wing|right[- ]wing)\s+(?:party|candidate|agenda|policy)\b/gi,
  /\b(?:elect(?:ion)?|ballot|referendum|impeach|filibuster)\b/gi,
  /\b(?:support|oppose|endorse|condemn)\s+(?:the\s+)?(?:president|prime\s+minister|senator|governor|congressman)\b/gi,
  /\b(?:political\s+(?:donation|contribution|lobbying|campaign))\b/gi,
];
export function politicalContent(options: PoliticalContentOptions): Guard {
  return { name: 'political-content', version: '0.1.0', description: 'Detect political content and campaigning', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of POLITICAL_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'political-content', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Political content: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains political content or campaigning' } : undefined,
      };
    },
  };
}
