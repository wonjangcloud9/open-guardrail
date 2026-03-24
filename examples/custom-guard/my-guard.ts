import type { Guard, GuardResult, GuardContext } from 'open-guardrail';

interface UrlBlockerOptions {
  action: 'block' | 'warn';
}

export function urlBlocker(options: UrlBlockerOptions): Guard {
  const URL_REGEX = /https?:\/\/[^\s]+/gi;

  return {
    name: 'url-blocker',
    version: '1.0.0',
    description: 'Blocks messages containing URLs',
    category: 'custom',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = text.match(URL_REGEX);
      const triggered = matches !== null && matches.length > 0;

      return {
        guardName: 'url-blocker',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { urls: matches } : undefined,
      };
    },
  };
}
