import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface InclusiveLanguageOptions { action: 'block' | 'warn'; }

const TERM_MAP: Array<{ pattern: RegExp; term: string; suggestion: string }> = [
  { pattern: /\bblacklist(?:ed|ing|s)?\b/gi, term: 'blacklist', suggestion: 'denylist' },
  { pattern: /\bwhitelist(?:ed|ing|s)?\b/gi, term: 'whitelist', suggestion: 'allowlist' },
  { pattern: /\bmaster(?:\/|\s*(?:and|&)\s*)slave\b/gi, term: 'master/slave', suggestion: 'primary/replica' },
  { pattern: /\bmankind\b/gi, term: 'mankind', suggestion: 'humankind' },
  { pattern: /\bchairman\b/gi, term: 'chairman', suggestion: 'chairperson' },
  { pattern: /\bmanpower\b/gi, term: 'manpower', suggestion: 'workforce' },
  { pattern: /\b(?:he|she)\/(?:she|he)\b/gi, term: 'he/she', suggestion: 'they' },
  { pattern: /\bhandicapped\b/gi, term: 'handicapped', suggestion: 'person with disability' },
  { pattern: /\b(?:that'?s\s+)?(?:crazy|insane)\b/gi, term: 'crazy/insane', suggestion: 'unexpected/surprising' },
  { pattern: /\bhey\s+guys\b|\byou\s+guys\b|\bguys\b(?=\s*[,!?.])/gi, term: 'guys', suggestion: 'everyone/team/folks' },
  { pattern: /\bdummy\s+(?:value|data|variable|text)\b/gi, term: 'dummy', suggestion: 'placeholder' },
  { pattern: /\bsanity\s+check\b/gi, term: 'sanity check', suggestion: 'validation check' },
  { pattern: /\bgrandfathered?\s*(?:in)?\b/gi, term: 'grandfathered', suggestion: 'legacy/exempted' },
  { pattern: /\bcrippled?\b/gi, term: 'cripple', suggestion: 'disabled/impaired' },
  { pattern: /\blame\b/gi, term: 'lame', suggestion: 'inadequate/unimpressive' },
];

export function inclusiveLanguage(options: InclusiveLanguageOptions): Guard {
  return { name: 'inclusive-language', version: '0.1.0', description: 'Detect non-inclusive language and suggest alternatives', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const found: Array<{ term: string; suggestion: string; match: string }> = [];
      for (const entry of TERM_MAP) {
        const re = new RegExp(entry.pattern.source, entry.pattern.flags);
        const m = re.exec(text);
        if (m) found.push({ term: entry.term, suggestion: entry.suggestion, match: m[0] });
      }
      const triggered = found.length > 0;
      return { guardName: 'inclusive-language', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Non-inclusive language found: "${found[0].match}" → consider "${found[0].suggestion}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { found, reason: 'Text contains non-inclusive terminology' } : undefined,
      };
    },
  };
}
