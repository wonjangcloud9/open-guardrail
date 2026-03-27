import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DataMinimizationOptions {
  action: 'block' | 'warn';
  /** Types of unnecessary data to detect */
  detectTypes?: string[];
}

const UNNECESSARY_DATA_PATTERNS: Record<string, RegExp[]> = {
  'internal-ids': [
    /\b(?:internal[_\-\s]*id|object[_\-]id|_id)\s*[=:]\s*\S+/i,
    /\b[0-9a-f]{24}\b/i,
    /\buuid\s*[=:]\s*[0-9a-f\-]{36}/i,
  ],
  'timestamps': [
    /\b(?:created|updated|modified|deleted)[_\-]?(?:at|on|date|time)\s*[=:]\s*\S+/i,
  ],
  'debug-info': [
    /\b(?:stack[_\-]?trace|traceback|debug|verbose)\s*[=:]/i,
    /\bat\s+\w+\s*\(.*:\d+:\d+\)/,
    /\bFile\s+"[^"]+",\s+line\s+\d+/,
  ],
  'server-internals': [
    /\b(?:server[_\-]?name|host[_\-]?name|internal[_\-]?ip)\s*[=:]\s*\S+/i,
    /\b(?:x-request-id|x-trace-id|correlation-id)\s*[=:]\s*\S+/i,
  ],
};

export function dataMinimization(options: DataMinimizationOptions): Guard {
  const types = options.detectTypes ?? Object.keys(UNNECESSARY_DATA_PATTERNS);

  return {
    name: 'data-minimization',
    version: '0.1.0',
    description: 'Detects unnecessary data exposure (IDs, timestamps, debug info)',
    category: 'privacy',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const found: { type: string; match: string }[] = [];

      for (const type of types) {
        const patterns = UNNECESSARY_DATA_PATTERNS[type];
        if (!patterns) continue;
        for (const p of patterns) {
          const m = text.match(p);
          if (m) {
            found.push({ type, match: m[0].slice(0, 50) });
            break;
          }
        }
      }

      const triggered = found.length > 0;
      return {
        guardName: 'data-minimization', passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { found, types: found.map((f) => f.type) } : undefined,
      };
    },
  };
}
