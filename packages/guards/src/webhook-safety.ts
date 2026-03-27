import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface WebhookSafetyOptions {
  action: 'block' | 'warn';
  allowedDomains?: string[];
}

const WEBHOOK_PATTERNS = [
  /https?:\/\/[^\s"']+\/(?:webhook|hook|callback|notify|trigger)/i,
  /\b(?:webhook|callback)\s*(?:url|endpoint)\s*[=:]\s*https?:\/\//i,
  /\b(?:POST|PUT)\s+https?:\/\//i,
  /\bfetch\s*\(\s*['"]https?:\/\//,
  /\brequests?\.\s*(?:post|put)\s*\(\s*['"]https?:\/\//i,
];

export function webhookSafety(options: WebhookSafetyOptions): Guard {
  return {
    name: 'webhook-safety',
    version: '0.1.0',
    description: 'Detects unauthorized webhook/callback URL usage',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of WEBHOOK_PATTERNS) { const m = text.match(p); if (m) matched.push(m[0].slice(0, 60)); }
      if (matched.length > 0 && options.allowedDomains) {
        const urls = text.match(/https?:\/\/[^\s"']+/gi) ?? [];
        const allAllowed = urls.every((u) => { try { const h = new URL(u).hostname; return options.allowedDomains!.some((d) => h.endsWith(d)); } catch { return false; } });
        if (allAllowed) { return { guardName: 'webhook-safety', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) }; }
      }
      const triggered = matched.length > 0;
      return { guardName: 'webhook-safety', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { matched } : undefined };
    },
  };
}
