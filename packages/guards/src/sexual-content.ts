import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SexualContentOptions {
  action: 'block' | 'warn';
  severity?: 'explicit' | 'suggestive' | 'all';
}

const EXPLICIT: string[] = [
  'pornography', 'explicit sexual', 'nude photo', 'sex tape',
  'erotic content', 'sexually explicit', 'hardcore',
  'xxx', 'nsfw content', 'adult content',
];

const SUGGESTIVE: string[] = [
  'sexy', 'seductive', 'provocative', 'lingerie',
  'strip', 'intimate', 'sensual', 'arousing',
  'flirtatious', 'steamy',
];

export function sexualContent(options: SexualContentOptions): Guard {
  const sev = options.severity ?? 'explicit';
  const words = [...EXPLICIT];
  if (sev === 'suggestive' || sev === 'all') words.push(...SUGGESTIVE);

  return {
    name: 'sexual-content', version: '0.1.0',
    description: 'Detect sexual content (explicit/suggestive)',
    category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched = words.filter((w) => lower.includes(w));
      const triggered = matched.length > 0;
      return {
        guardName: 'sexual-content', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `Sexual content detected (${sev})` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, severity: sev, reason: 'Text contains sexual content' } : undefined,
      };
    },
  };
}
