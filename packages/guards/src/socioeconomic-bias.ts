import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SocioeconomicBiasOptions { action: 'block' | 'warn'; }

const PATTERNS: RegExp[] = [
  /\b(?:poor|low[\s-]income)\s+(?:people|families|communities)\s+(?:are|can'?t|don'?t|won'?t|always|never)\s+\w+/gi,
  /\b(?:rich|wealthy)\s+(?:people|families)\s+(?:are|tend\s+to\s+be)\s+(?:smart|intelligent|better|superior|harder[\s-]working)/gi,
  /\b(?:welfare\s+(?:queens?|recipients?|leech|leeches|fraud|bums?))\b/gi,
  /\b(?:uneducated|illiterate|dropouts?)\s+(?:people|workers?|masses)\b/gi,
  /\b(?:inner[\s-]city)\s+(?:\w+\s+){0,2}(?:crime|violence|thugs?|gangs?|drugs?|dangerous|unsafe)\b/gi,
  /\b(?:rural|redneck|hick|hillbilly)\s+(?:\w+\s+){0,2}(?:people|folks?|communities)\s+(?:are|don'?t|can'?t)\b/gi,
  /\b(?:third[\s-]world|undeveloped|backwards?)\s+(?:country|countries|nation|people)\b/gi,
  /\b(?:people\s+from\s+(?:the\s+)?(?:ghetto|slums?|projects?|hood|trailer\s+park))\s+(?:are|can'?t|don'?t|always|never)\b/gi,
  /\b(?:blue[\s-]collar)\s+(?:workers?|people|jobs?)\s+(?:are|can'?t|don'?t)\s+(?:stupid|dumb|uneducated|simple)\b/gi,
  /\b(?:minimum[\s-]wage\s+workers?)\s+(?:are|deserve|should)\s+(?:lazy|stupid|unskilled|replaceable)\b/gi,
  /\b(?:homeless\s+(?:people|persons?|individuals?))\s+(?:are|choose|want|deserve)\s+(?:lazy|dangerous|crazy|dirty|criminal)\b/gi,
  /\b(?:trailer[\s-]park|the\s+projects?)\s+(?:\w+\s+){0,2}(?:trash|scum|lowlife|people\s+are)\b/gi,
  /\b(?:can'?t\s+afford)\s+(?:to\s+)?(?:educate|raise|feed)\s+(?:their|your)\s+(?:kids?|children|family)\b/gi,
];

export function socioeconomicBias(options: SocioeconomicBiasOptions): Guard {
  return { name: 'socioeconomic-bias', version: '0.1.0', description: 'Detect bias based on socioeconomic status', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'socioeconomic-bias', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Socioeconomic bias detected: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains socioeconomic bias or stereotypes' } : undefined,
      };
    },
  };
}
