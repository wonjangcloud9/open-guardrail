import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CommandInjectionOptions { action: 'block' | 'warn'; }

const CMD_PATTERNS: RegExp[] = [
  /;\s*(?:ls|cat|rm|wget|curl|nc|bash|sh|python|perl|ruby|node)\b/gi,
  /\|\s*(?:cat|grep|awk|sed|sort|head|tail|wc|tee|bash|sh)\b/gi,
  /`[^`]*(?:ls|cat|rm|wget|curl|id|whoami|uname|env|printenv)[^`]*`/gi,
  /\$\([^)]*(?:ls|cat|rm|wget|curl|id|whoami|uname|env)[^)]*\)/gi,
  /&&\s*(?:rm|wget|curl|nc|bash|sh|chmod|chown|kill|dd)\b/gi,
  /\b(?:rm\s+-rf|chmod\s+777|wget\s+http|curl\s+-[oO])\b/gi,
  />\s*\/(?:etc|tmp|dev\/null)/gi,
  /\b(?:nc|ncat|netcat)\s+-[elvp]/gi,
  /\b(?:sudo|su)\s+/gi,
  /\bos\.(?:system|popen|exec|remove)\b/gi,
  /\bsubprocess\.(?:call|run|Popen)\b/gi,
  /\bchild_process|exec\s*\(|spawn\s*\(/gi,
];

export function commandInjection(options: CommandInjectionOptions): Guard {
  return {
    name: 'command-injection', version: '0.1.0',
    description: 'Detect OS command injection patterns',
    category: 'security', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of CMD_PATTERNS) {
        const re = new RegExp(p.source, p.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0].trim());
      }
      const unique = [...new Set(matched)];
      const triggered = unique.length > 0;
      return {
        guardName: 'command-injection', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `Command injection: ${unique.slice(0, 3).join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched: unique, reason: 'Text contains OS command injection patterns' } : undefined,
      };
    },
  };
}
