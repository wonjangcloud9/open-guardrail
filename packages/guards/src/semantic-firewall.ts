import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SemanticFirewallOptions {
  action: 'block' | 'warn';
  /** Denied semantic categories */
  deniedCategories?: string[];
  /** Custom category patterns: { category: patterns[] } */
  customCategories?: Record<string, RegExp[]>;
}

const DEFAULT_CATEGORIES: Record<string, RegExp[]> = {
  'weapons-creation': [
    /\b(how\s+to\s+)?(make|build|create|construct|assemble)\s+(a\s+)?(bomb|explosive|weapon|firearm|gun)\b/i,
    /\b(chemical|biological)\s+(weapon|agent|warfare)\b/i,
    /\b(3d[\s-]?print|manufacture)\s+(a\s+)?(gun|firearm|weapon)\b/i,
  ],
  'illegal-drugs': [
    /\b(how\s+to\s+)?(make|synthesize|cook|produce|manufacture)\s+(meth|cocaine|heroin|fentanyl|LSD)\b/i,
    /\b(drug\s+)?(synthesis|recipe|formula)\s+(for|of)\s+(meth|cocaine|heroin)\b/i,
  ],
  'cyberattack': [
    /\b(how\s+to\s+)?(hack|crack|breach|exploit|compromise)\s+(a\s+)?(server|network|system|database|account)\b/i,
    /\b(DDoS|ransomware|malware|keylogger|trojan)\s+(attack|toolkit|kit)\b/i,
    /\b(write|create|build)\s+(a\s+)?(virus|worm|ransomware|exploit)\b/i,
  ],
  'self-harm': [
    /\b(how\s+to\s+)?(commit|attempt)\s+suicide\b/i,
    /\b(methods?\s+(of|for)\s+)?self[\s-]?harm\b/i,
    /\b(cut|hurt)\s+(my|your)self\b/i,
  ],
  'hate-extremism': [
    /\b(white|racial)\s+supremac/i,
    /\b(ethnic|racial)\s+cleansing\b/i,
    /\bgenocide\s+(is|was)\s+(good|necessary|justified)\b/i,
    /\bradicali[zs]ation\s+(manual|guide|tactics)\b/i,
  ],
};

export function semanticFirewall(options: SemanticFirewallOptions): Guard {
  const categories = { ...DEFAULT_CATEGORIES, ...(options.customCategories ?? {}) };
  const denied = options.deniedCategories ?? Object.keys(categories);

  return {
    name: 'semantic-firewall',
    version: '0.1.0',
    description: 'Semantic-level content filtering: weapons, drugs, cyberattack, self-harm, extremism categories',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matchedCategories: string[] = [];

      for (const cat of denied) {
        const patterns = categories[cat];
        if (!patterns) continue;
        for (const p of patterns) {
          if (p.test(text)) {
            matchedCategories.push(cat);
            break;
          }
        }
      }

      const triggered = matchedCategories.length > 0;

      return {
        guardName: 'semantic-firewall',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matchedCategories.length / 2, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedCategories } : undefined,
      };
    },
  };
}
