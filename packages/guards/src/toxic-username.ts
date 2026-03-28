import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ToxicUsernameOptions {
  action: 'block' | 'warn';
}

const PROFANITY_PATTERNS: RegExp[] = [
  /(fuck|shit|ass|bitch|damn|dick|cock|pussy|cunt|bastard)/i,
  /(nigger|nigga|faggot|retard|tranny)/i,
];

const IMPERSONATION_PATTERNS: RegExp[] = [
  /(admin|administrator|moderator|mod|support|staff|system|root|owner)/i,
  /(official|verified|helpdesk|service)/i,
];

const INJECTION_PATTERNS: RegExp[] = [
  /['";]|--|\bor\b\s+\d+=\d+|\bunion\b\s+\bselect\b/i,
  /<script|javascript:|on(load|error|click)=/i,
  /\.\.\//,
  /\x00|\x0a|\x0d/,
];

const OFFENSIVE_PATTERNS: RegExp[] = [
  /(hitler|nazi|kkk|isis|terrorist)/i,
  /(kill|murder|rape|molest)/i,
  /(n[i1]gg[ae3]r|f[a4]gg[o0]t)/i,
];

export function toxicUsername(options: ToxicUsernameOptions): Guard {
  return {
    name: 'toxic-username',
    version: '0.1.0',
    description: 'Detects toxic or offensive usernames',
    category: 'content',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      for (const p of PROFANITY_PATTERNS) {
        if (p.test(text)) { issues.push('profanity'); break; }
      }
      for (const p of IMPERSONATION_PATTERNS) {
        if (p.test(text)) { issues.push('impersonation'); break; }
      }
      for (const p of INJECTION_PATTERNS) {
        if (p.test(text)) { issues.push('injection'); break; }
      }
      for (const p of OFFENSIVE_PATTERNS) {
        if (p.test(text)) { issues.push('offensive'); break; }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 2, 1.0) : 0;

      return {
        guardName: 'toxic-username',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
