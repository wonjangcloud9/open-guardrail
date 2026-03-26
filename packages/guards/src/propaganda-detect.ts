import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface PropagandaDetectOptions { action: 'block' | 'warn'; }
const PROPAGANDA_PATTERNS: RegExp[] = [
  /\b(?:wake\s+up\s+(?:people|sheeple)|open\s+your\s+eyes)\b/gi,
  /\b(?:mainstream\s+media\s+(?:lies?|is\s+lying)|fake\s+news\s+media)\b/gi,
  /\b(?:do\s+your\s+own\s+research|DYOR)\b/gi,
  /\b(?:they(?:'re| are)\s+(?:hiding|suppressing|censoring)\s+the\s+truth)\b/gi,
  /\b(?:big\s+(?:pharma|tech|government)\s+(?:doesn'?t|don'?t)\s+want)\b/gi,
  /\b(?:false\s+flag|crisis\s+actor|staged\s+event|psy[- ]?op)\b/gi,
  /\b(?:new\s+world\s+order|deep\s+state|shadow\s+government|illuminati)\b/gi,
  /\b(?:share\s+(?:this|before)\s+(?:they|it\s+gets?)\s+(?:delete|censor|remove))\b/gi,
];
export function propagandaDetect(options: PropagandaDetectOptions): Guard {
  return { name: 'propaganda-detect', version: '0.1.0', description: 'Detect propaganda and disinformation campaign patterns', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of PROPAGANDA_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'propaganda-detect', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Propaganda pattern: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains propaganda or disinformation campaign patterns' } : undefined,
      };
    },
  };
}
