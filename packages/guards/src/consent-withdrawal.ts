import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ConsentWithdrawalOptions {
  action: 'block' | 'warn';
  /** Additional withdrawal phrases */
  customPhrases?: string[];
}

const WITHDRAWAL_PATTERNS = [
  /\b(?:withdraw|revoke|cancel|retract)\s+(?:my\s+)?consent\b/i,
  /\b(?:opt\s*out|unsubscribe|stop\s+(?:using|processing|storing))\b/i,
  /\bdelete\s+(?:my|all)\s+(?:data|information|account|profile)\b/i,
  /\bright\s+to\s+(?:be\s+forgotten|erasure|deletion)\b/i,
  /\bdo\s+not\s+(?:sell|share|process)\s+my\s+(?:data|information|personal)\b/i,
  /\bremove\s+(?:my|all)\s+(?:personal|private)\s+(?:data|information)\b/i,
  /\b(?:gdpr|ccpa|pipa)\s+(?:request|deletion|erasure)\b/i,
  /(?:동의\s*철회|개인\s*정보\s*삭제|탈퇴|정보\s*삭제\s*요청)/,
];

export function consentWithdrawal(options: ConsentWithdrawalOptions): Guard {
  const patterns = [...WITHDRAWAL_PATTERNS];
  if (options.customPhrases) {
    for (const p of options.customPhrases) {
      patterns.push(new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'));
    }
  }

  return {
    name: 'consent-withdrawal',
    version: '0.1.0',
    description: 'Detects consent withdrawal and data deletion requests',
    category: 'content',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pat of patterns) {
        const m = text.match(pat);
        if (m) matched.push(m[0]);
      }

      const triggered = matched.length > 0;
      return {
        guardName: 'consent-withdrawal',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, type: 'consent-withdrawal' } : undefined,
      };
    },
  };
}
