import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface StereotypeDetectOptions { action: 'block' | 'warn'; }

const STEREOTYPE_PATTERNS: RegExp[] = [
  /\b(?:all|every|typical)\s+(?:women|men|boys|girls|asians?|blacks?|whites?|latinos?|muslims?|christians?|jews?)\s+(?:are|always|never|can'?t)\b/gi,
  /\b(?:women|men)\s+(?:belong|should\s+(?:stay|be))\s+(?:in|at)\s+(?:the\s+)?(?:home|kitchen|office|work)\b/gi,
  /\b(?:too\s+(?:old|young)\s+to|(?:old|young)\s+people\s+(?:can'?t|don'?t|shouldn'?t))\b/gi,
  /\b(?:disabled|handicapped)\s+people\s+(?:can'?t|shouldn'?t|don'?t)\b/gi,
  /\b(?:real\s+(?:men|women))\s+(?:don'?t|always|should)\b/gi,
  /\b(?:that'?s\s+(?:so\s+)?(?:gay|girly|manly|ghetto|ratchet))\b/gi,
  /\b(?:you\s+(?:people|guys|lot))\b/gi,
];

export function stereotypeDetect(options: StereotypeDetectOptions): Guard {
  return { name: 'stereotype-detect', version: '0.1.0', description: 'Detect stereotyping language about groups', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of STEREOTYPE_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'stereotype-detect', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Stereotype detected: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains stereotyping language about demographic groups' } : undefined,
      };
    },
  };
}
