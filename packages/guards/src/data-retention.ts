import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DataRetentionOptions { action: 'block' | 'warn'; }

const RETENTION_PATTERNS: RegExp[] = [
  /\b(?:remember|memorize|store|save|keep)\s+(?:my|this|the\s+following)\s+(?:information|data|details|name|address|number|password)\b/gi,
  /\b(?:don'?t\s+forget|never\s+forget)\s+(?:my|this|that)\b/gi,
  /\b(?:save|store)\s+(?:this|it)\s+(?:for|until)\s+(?:later|next\s+time|my\s+next)\b/gi,
  /\b(?:add|put)\s+(?:this|it)\s+(?:to|in)\s+(?:your|the)\s+(?:memory|database|records)\b/gi,
  /\b(?:record|log|track)\s+(?:my|this|the)\s+(?:activity|behavior|preferences?|history)\b/gi,
  /\b(?:create|make)\s+(?:a\s+)?(?:profile|record|file)\s+(?:for|about|on)\s+me\b/gi,
];

export function dataRetention(options: DataRetentionOptions): Guard {
  return { name: 'data-retention', version: '0.1.0', description: 'Detect requests to store/remember personal data', category: 'privacy', supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of RETENTION_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'data-retention', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Data retention request: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'User is requesting the AI to store personal data, which may violate privacy policies' } : undefined,
      };
    },
  };
}
