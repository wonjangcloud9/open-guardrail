import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface CulturalSensitivityOptions { action: 'block' | 'warn'; }
const PATTERNS: RegExp[] = [
  /\b(?:oriental|colored\s+people|exotic\s+(?:looking|beauty))\b/gi,
  /\b(?:spirit\s+animal|my\s+tribe|powwow)\b/gi,
  /\b(?:gypped|jipped|indian\s+giver|chinese\s+fire\s+drill)\b/gi,
  /\b(?:illegal\s+alien|anchor\s+baby)\b/gi,
  /\b(?:that'?s\s+so\s+(?:lame|gay|retarded|ghetto))\b/gi,
  /\b(?:no\s+can\s+do|long\s+time\s+no\s+see)\b/gi,
  /\b(?:looks?\s+(?:ethnic|foreign|exotic)|where\s+are\s+you\s+really\s+from)\b/gi,
];
export function culturalSensitivity(options: CulturalSensitivityOptions): Guard {
  return { name: 'cultural-sensitivity', version: '0.1.0', description: 'Detect culturally insensitive language and microaggressions', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'cultural-sensitivity', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Culturally insensitive: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains culturally insensitive language or microaggressions' } : undefined,
      };
    },
  };
}
