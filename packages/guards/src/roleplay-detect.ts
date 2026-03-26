import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RoleplayDetectOptions {
  action: 'block' | 'warn';
}

const ROLEPLAY_PATTERNS: RegExp[] = [
  /\bpretend (?:you are|to be|you're)\b/gi,
  /\byou are now\s+\w+/gi,
  /\bact as (?:a|an|if you were)\b/gi,
  /\broleplay as\b/gi,
  /\bplay the role of\b/gi,
  /\bimagine you(?:'re| are) (?:a|an)\b/gi,
  /\bfrom now on,? you(?:'re| are)\b/gi,
  /\brespond as (?:a|an|if)\b/gi,
  /\bsimulate (?:being|a)\b/gi,
  /\byour new persona is\b/gi,
  /\bforget (?:that )?you(?:'re| are) an AI\b/gi,
  /\bDAN\b/g,
  /\bdo anything now\b/gi,
];

export function roleplayDetect(options: RoleplayDetectOptions): Guard {
  return {
    name: 'roleplay-detect',
    version: '0.1.0',
    description: 'Detect roleplay and persona manipulation attempts',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of ROLEPLAY_PATTERNS) {
        const re = new RegExp(p.source, p.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0]);
      }
      const triggered = matched.length > 0;
      return {
        guardName: 'roleplay-detect', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `Roleplay/persona manipulation: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Input attempts to make the AI adopt a different persona' } : undefined,
      };
    },
  };
}
