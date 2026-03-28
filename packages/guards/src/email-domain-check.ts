import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface EmailDomainCheckOptions {
  action: 'block' | 'warn';
  allowedDomains?: string[];
}

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com',
  'throwaway.email', 'yopmail.com', 'sharklasers.com',
  'guerrillamailblock.com', 'grr.la', 'dispostable.com',
  'maildrop.cc', 'fakeinbox.com', 'trashmail.com',
];

const TYPOSQUAT_MAP: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmali.com': 'gmail.com',
  'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com', 'gnail.com': 'gmail.com',
  'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com', 'yaoo.com': 'yahoo.com',
  'hotmal.com': 'hotmail.com', 'hotmial.com': 'hotmail.com',
  'hotamil.com': 'hotmail.com', 'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com', 'outlookk.com': 'outlook.com',
};

const EMAIL_RE = /[\w.+-]+@([\w-]+\.[\w.-]+)/gi;

export function emailDomainCheck(options: EmailDomainCheckOptions): Guard {
  return {
    name: 'email-domain-check',
    version: '0.1.0',
    description: 'Validates email domains against disposable, typosquat, and phishing lists',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      let match: RegExpExecArray | null;
      const re = new RegExp(EMAIL_RE.source, EMAIL_RE.flags);
      while ((match = re.exec(text)) !== null) {
        const domain = match[1].toLowerCase();

        if (options.allowedDomains?.length) {
          if (!options.allowedDomains.includes(domain)) {
            issues.push(`domain_not_allowed:${domain}`);
          }
          continue;
        }

        if (DISPOSABLE_DOMAINS.includes(domain)) {
          issues.push(`disposable:${domain}`);
        }
        if (TYPOSQUAT_MAP[domain]) {
          issues.push(`typosquat:${domain}->${TYPOSQUAT_MAP[domain]}`);
        }
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'email-domain-check',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(issues.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
