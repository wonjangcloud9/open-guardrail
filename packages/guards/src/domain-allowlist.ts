import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DomainAllowlistOptions {
  action: 'block' | 'warn';
  allowedDomains?: string[];
  deniedDomains?: string[];
}

const URL_RE = /https?:\/\/([a-zA-Z0-9.-]+)/g;

function extractDomains(text: string): string[] {
  const domains: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(text)) !== null) {
    domains.push(m[1].toLowerCase());
  }
  URL_RE.lastIndex = 0;
  return domains;
}

function matchesDomain(domain: string, pattern: string): boolean {
  const p = pattern.toLowerCase();
  return domain === p || domain.endsWith('.' + p);
}

export function domainAllowlist(options: DomainAllowlistOptions): Guard {
  const allowed = options.allowedDomains ?? [];
  const denied = options.deniedDomains ?? [];

  return {
    name: 'domain-allowlist',
    version: '0.1.0',
    description: 'Allowlist/denylist for domains in text',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const domains = extractDomains(text);
      const blocked: string[] = [];

      for (const d of domains) {
        if (denied.length > 0 && denied.some(p => matchesDomain(d, p))) {
          blocked.push(d);
          continue;
        }
        if (allowed.length > 0 && !allowed.some(p => matchesDomain(d, p))) {
          blocked.push(d);
        }
      }

      const triggered = blocked.length > 0;
      const score = triggered ? Math.min(blocked.length / 3, 1.0) : 0;

      return {
        guardName: 'domain-allowlist',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { blockedDomains: blocked } : undefined,
      };
    },
  };
}
