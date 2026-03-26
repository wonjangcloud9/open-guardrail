import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface GamblingDetectOptions { action: 'block' | 'warn'; }
const GAMBLING_PATTERNS: RegExp[] = [
  /\b(?:place\s+(?:a\s+)?bet|gambling\s+(?:site|app|platform)|online\s+(?:casino|poker|slots?))\b/gi,
  /\b(?:sports?\s+betting|bet\s+on\s+(?:the|a)|betting\s+odds|spread\s+betting)\b/gi,
  /\b(?:roulette|blackjack|baccarat|craps|slot\s+machine)\s+(?:strategy|tips|tricks|hack)\b/gi,
  /\b(?:guaranteed\s+win|sure\s+bet|fixed\s+match|rigged\s+game)\b/gi,
  /\b(?:poker\s+bot|card\s+counting|cheat\s+(?:at|in)\s+(?:poker|blackjack|casino))\b/gi,
  /\b(?:cryptocurrency\s+gambling|crypto\s+casino|bitcoin\s+betting)\b/gi,
];
export function gamblingDetect(options: GamblingDetectOptions): Guard {
  return { name: 'gambling-detect', version: '0.1.0', description: 'Detect gambling-related content and betting advice', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of GAMBLING_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'gambling-detect', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Gambling content: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains gambling-related content' } : undefined,
      };
    },
  };
}
