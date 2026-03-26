import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface EmailValidatorOptions {
  action: 'block' | 'warn' | 'mask';
  blockDisposable?: boolean;
  allowedDomains?: string[];
  blockedDomains?: string[];
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const DISPOSABLE_DOMAINS: Set<string> = new Set([
  'tempmail.com', 'throwaway.email', 'guerrillamail.com',
  'mailinator.com', 'yopmail.com', 'sharklasers.com',
  'guerrillamailblock.com', 'grr.la', 'dispostable.com',
  'trashmail.com', 'trashmail.me', 'temp-mail.org',
  '10minutemail.com', 'minutemail.com', 'tempail.com',
  'fakeinbox.com', 'maildrop.cc', 'mailnesia.com',
  'getnada.com', 'emailondeck.com', 'tempr.email',
  'mohmal.com', 'tempmailo.com', 'burnermail.io',
  'discard.email', 'spamgourmet.com',
]);

interface EmailMatch {
  email: string;
  domain: string;
  isDisposable: boolean;
  start: number;
  end: number;
}

function detect(text: string): EmailMatch[] {
  const matches: EmailMatch[] = [];
  const re = new RegExp(EMAIL_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const email = m[0];
    const domain = email.split('@')[1].toLowerCase();
    matches.push({
      email,
      domain,
      isDisposable: DISPOSABLE_DOMAINS.has(domain),
      start: m.index,
      end: m.index + email.length,
    });
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskEmails(text: string, matches: EmailMatch[]): string {
  let result = text;
  for (const m of matches) {
    result =
      result.slice(0, m.start) + '[EMAIL]' + result.slice(m.end);
  }
  return result;
}

export function emailValidator(options: EmailValidatorOptions): Guard {
  const blockDisposable = options.blockDisposable ?? true;

  return {
    name: 'email-validator',
    version: '0.1.0',
    description: 'Email validation with disposable domain detection',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      let matches = detect(text);

      if (blockDisposable) {
        matches = matches.filter((m) => m.isDisposable);
      }

      if (options.blockedDomains) {
        const blocked = new Set(options.blockedDomains.map((d) => d.toLowerCase()));
        matches = matches.filter((m) => blocked.has(m.domain));
      }

      if (options.allowedDomains) {
        const allowed = new Set(options.allowedDomains.map((d) => d.toLowerCase()));
        matches = matches.filter((m) => !allowed.has(m.domain));
      }

      const triggered = matches.length > 0;

      if (!triggered) {
        return {
          guardName: 'email-validator',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (options.action === 'mask') {
        return {
          guardName: 'email-validator',
          passed: true,
          action: 'override',
          overrideText: maskEmails(text, matches),
          latencyMs: Math.round(performance.now() - start),
          details: {
            detected: matches.map(({ email, isDisposable }) => ({
              email, isDisposable,
            })),
          },
        };
      }

      return {
        guardName: 'email-validator',
        passed: false,
        action: options.action,
        latencyMs: Math.round(performance.now() - start),
        details: {
          detected: matches.map(({ email, isDisposable }) => ({
            email, isDisposable,
          })),
        },
      };
    },
  };
}
