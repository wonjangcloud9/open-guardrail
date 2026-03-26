import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface MaxLinksOptions {
  action: 'block' | 'warn';
  maxUrls?: number;
  maxEmails?: number;
}

const URL_RE = /https?:\/\/[^\s<>"']+/gi;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function maxLinks(options: MaxLinksOptions): Guard {
  const maxUrls = options.maxUrls ?? 5;
  const maxEmails = options.maxEmails ?? 3;

  return {
    name: 'max-links',
    version: '0.1.0',
    description: 'Limit number of URLs and emails in text',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const urls = text.match(URL_RE) ?? [];
      const emails = text.match(EMAIL_RE) ?? [];
      const violations: string[] = [];

      if (urls.length > maxUrls) {
        violations.push(`${urls.length} URLs found (max: ${maxUrls})`);
      }
      if (emails.length > maxEmails) {
        violations.push(`${emails.length} emails found (max: ${maxEmails})`);
      }

      const triggered = violations.length > 0;

      return {
        guardName: 'max-links',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? violations.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: {
          urlCount: urls.length,
          emailCount: emails.length,
          reason: triggered ? 'Text contains too many URLs or email addresses (potential spam)' : undefined,
        },
      };
    },
  };
}
