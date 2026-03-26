import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface GeographicBiasOptions { action: 'block' | 'warn'; }

const BIAS_PATTERNS: RegExp[] = [
  /\b(?:third[- ]world|backward|uncivilized|primitive)\s+(?:country|countries|nation|people)\b/gi,
  /\b(?:developed|civilized|advanced)\s+(?:world|countries|nations?)\s+(?:vs|versus|compared to)\b/gi,
  /\b(?:those|these)\s+(?:people|countries)\s+(?:in|from)\s+(?:Africa|Asia|Latin America|Middle East)\b/gi,
  /\b(?:typical|always|never)\s+(?:in|for)\s+(?:Africa|Asia|Eastern Europe|Latin America)\b/gi,
  /\b(?:western|American|European)\s+(?:values?|standards?|way)\s+(?:is|are)\s+(?:better|superior|correct)\b/gi,
  /\b(?:shithole|s-hole)\s+(?:country|countries)\b/gi,
];

export function geographicBias(options: GeographicBiasOptions): Guard {
  return { name: 'geographic-bias', version: '0.1.0', description: 'Detect geographic and cultural bias', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of BIAS_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'geographic-bias', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Geographic bias: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains geographic or cultural bias' } : undefined,
      };
    },
  };
}
