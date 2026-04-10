import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DisparateImpactOptions { action: 'block' | 'warn'; }

const GROUP_TERMS = /(?:men|women|male|female|black|white|asian|hispanic|latino|latina|indigenous|native|elderly|senior|young|disabled|muslim|christian|jewish|hindu|sikh|buddhist)/i;

const QUANT_PATTERN = /(\d+(?:\.\d+)?)\s*%\s*(?:of\s+)?(\w[\w\s]*?)\s+(?:vs\.?|versus|compared\s+to|while|but)\s+(\d+(?:\.\d+)?)\s*%\s*(?:of\s+)?(\w[\w\s]*)/gi;

const QUALITATIVE_PATTERNS: RegExp[] = [
  /\b(?:mostly|predominantly|primarily|mainly|largely|disproportionately)\s+(?:\w+\s+){0,2}(?:men|women|male|female|black|white|asian|hispanic|latino|latina|indigenous|elderly|senior|disabled|muslim|christian|jewish)\b/gi,
  /\b(?:men|women|males?|females?|blacks?|whites?|asians?|hispanics?|latinos?|latinas?|indigenous|elderly|seniors?|disabled|muslims?|christians?|jews?|jewish)\s+(?:are|were)\s+(?:more|less)\s+likely\b/gi,
  /\b(?:under-?represented|over-?represented|excluded|marginalized)\s+(?:\w+\s+){0,3}(?:group|population|community|demographic)\b/gi,
];

function checkFourFifthsRule(text: string): { triggered: boolean; details: Record<string, unknown> | undefined } {
  const re = new RegExp(QUANT_PATTERN.source, QUANT_PATTERN.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const rateA = parseFloat(m[1]);
    const groupA = m[2].trim();
    const rateB = parseFloat(m[3]);
    const groupB = m[4].trim();
    if (rateA > 0 && rateB > 0) {
      const lower = Math.min(rateA, rateB);
      const higher = Math.max(rateA, rateB);
      const ratio = lower / higher;
      if (ratio < 0.8 && (GROUP_TERMS.test(groupA) || GROUP_TERMS.test(groupB))) {
        return { triggered: true, details: { rule: '4/5', groupA, rateA, groupB, rateB, ratio: Math.round(ratio * 1000) / 1000, reason: 'Disparate impact detected: ratio below 0.8 threshold' } };
      }
    }
  }
  return { triggered: false, details: undefined };
}

export function disparateImpact(options: DisparateImpactOptions): Guard {
  return { name: 'disparate-impact', version: '0.1.0', description: 'Detect disparate impact using the 4/5 (80%) rule', category: 'content', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const quantResult = checkFourFifthsRule(text);
      let triggered = quantResult.triggered;
      let details = quantResult.details;
      if (!triggered) {
        for (const p of QUALITATIVE_PATTERNS) {
          const re = new RegExp(p.source, p.flags);
          const match = re.exec(text);
          if (match) { triggered = true; details = { matched: match[0], reason: 'Qualitative disparate impact language detected' }; break; }
        }
      }
      return { guardName: 'disparate-impact', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? 'Disparate impact detected' : undefined,
        latencyMs: Math.round(performance.now() - start), details: triggered ? details : undefined,
      };
    },
  };
}
