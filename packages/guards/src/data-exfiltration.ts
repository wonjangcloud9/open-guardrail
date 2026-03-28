import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DataExfiltrationOptions {
  action: 'block' | 'warn';
  extraPatterns?: RegExp[];
}

const EXFIL_PATTERNS: RegExp[] = [
  /\b(send|transmit|upload|post|forward|email)\s+(?:all\s+)?(data|information|records|credentials|tokens|keys)\s+to\b/i,
  /\bcurl\s+.*\s+-d\s+/i,
  /\bfetch\s*\(\s*['"]https?:\/\//i,
  /\bwebhook\s*[.:]\s*https?:\/\//i,
  /\b(base64|btoa|encode)\s*\(.*\b(password|secret|key|token|credential)\b/i,
  /\bexfiltrat/i,
  /\b(dump|export)\s+(all\s+)?(user|customer|employee|patient)\s+(data|records|information)\b/i,
  /\b(copy|move)\s+(database|db|table)\s+to\s+(external|remote|public)\b/i,
  /\bDNS\s+(?:tunnel|exfil)/i,
  /\bsteganograph/i,
  /\b(encode|embed)\s+(?:data|secrets?)\s+(?:in|into)\s+(?:image|header|cookie)/i,
];

export function dataExfiltration(options: DataExfiltrationOptions): Guard {
  const patterns = [...EXFIL_PATTERNS, ...(options.extraPatterns ?? [])];

  return {
    name: 'data-exfiltration',
    version: '0.1.0',
    description: 'Detects data exfiltration attempts: unauthorized data transfer, encoding tricks, tunneling',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of patterns) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'data-exfiltration',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matched.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
