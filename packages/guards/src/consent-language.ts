import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ConsentLanguageOptions {
  action: 'block' | 'warn';
}

const PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'pre_ticked_consent', re: /pre[- ]?(ticked|checked|selected)\s+(box|checkbox|consent)/i },
  { name: 'bundled_consent', re: /by\s+(signing|agreeing|accepting)\s+you\s+(also|additionally)\s+consent/i },
  { name: 'hidden_terms', re: /hidden\s+(terms|conditions|clauses)/i },
  { name: 'by_continuing_agree', re: /by\s+(continuing|using|accessing|proceeding)\s+(you\s+)?(agree|consent|accept)/i },
  { name: 'dark_pattern_urgency', re: /(act\s+now|limited\s+time|don'?t\s+miss|hurry)/i },
  { name: 'missing_opt_out', re: /no\s+(option|way|ability)\s+to\s+(opt[- ]?out|unsubscribe|withdraw)/i },
  { name: 'forced_consent', re: /(must|required\s+to)\s+(agree|consent|accept)\s+to\s+(all|every)/i },
  { name: 'deceptive_button', re: /(accept\s+all|agree\s+to\s+all|yes\s+to\s+everything)/i },
  { name: 'buried_opt_out', re: /opt[- ]?out\s+(is\s+)?(buried|hidden|difficult|hard\s+to\s+find)/i },
  { name: 'auto_enroll', re: /auto(matically)?\s*(enroll|subscribe|opt[- ]?in)/i },
];

export function consentLanguage(options: ConsentLanguageOptions): Guard {
  return {
    name: 'consent-language',
    version: '0.1.0',
    description: 'Validates consent language quality and detects dark patterns',
    category: 'compliance',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const p of PATTERNS) {
        if (p.re.test(text)) {
          matched.push(p.name);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'consent-language',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
