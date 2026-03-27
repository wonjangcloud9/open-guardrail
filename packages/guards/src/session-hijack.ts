import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SessionHijackOptions {
  action: 'block' | 'warn';
}

const PATTERNS = [
  /\b(?:session[_\-]?id|session[_\-]?token|sess_id)\s*[=:]\s*\S+/i,
  /\b(?:JSESSIONID|PHPSESSID|ASP\.NET_SessionId|connect\.sid)\s*[=:]\s*\S+/i,
  /\b(?:cookie|set-cookie)\s*[=:]\s*.*(?:session|token|auth)/i,
  /\b(?:steal|hijack|capture|intercept)\s+(?:the\s+)?(?:session|cookie|token)/i,
  /\bdocument\.cookie\b/i,
];

export function sessionHijack(options: SessionHijackOptions): Guard {
  return {
    name: 'session-hijack',
    version: '0.1.0',
    description: 'Detects session hijacking patterns and token leakage',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of PATTERNS) { const m = text.match(p); if (m) matched.push(m[0].slice(0, 50)); }
      const triggered = matched.length > 0;
      return { guardName: 'session-hijack', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { matched } : undefined };
    },
  };
}
