import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface UrlAccessibilityOptions {
  action: 'block' | 'warn';
}

export function urlAccessibility(options: UrlAccessibilityOptions): Guard {
  return {
    name: 'url-accessibility',
    version: '0.1.0',
    description: 'Checks URL accessibility concerns',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      const clickHerePattern = /\[click\s+here\]\(https?:\/\/[^)]+\)/gi;
      const clickMatches = text.match(clickHerePattern) ?? [];
      for (const m of clickMatches) {
        issues.push(`Non-descriptive link text: ${m.slice(0, 50)}`);
      }

      const rawUrlPattern = /(?<!\[|\()https?:\/\/[^\s)\]]+/g;
      const mdLinkPattern = /\[[^\]]+\]\(https?:\/\/[^)]+\)/g;
      const mdLinks = new Set((text.match(mdLinkPattern) ?? []).map((m) => {
        const urlMatch = m.match(/\((https?:\/\/[^)]+)\)/);
        return urlMatch ? urlMatch[1] : '';
      }));
      const rawUrls = text.match(rawUrlPattern) ?? [];
      for (const url of rawUrls) {
        if (!mdLinks.has(url)) {
          issues.push(`Raw URL without descriptive text: ${url.slice(0, 60)}`);
        }
      }

      const brokenAnchor = /\[([^\]]*)\]\(#([^)]*)\)/g;
      let anchorMatch: RegExpExecArray | null;
      while ((anchorMatch = brokenAnchor.exec(text)) !== null) {
        const target = anchorMatch[2];
        const headingSlug = text
          .match(/^#{1,6}\s+(.+)$/gm)
          ?.map((h) => h.replace(/^#+\s+/, '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'));
        if (!headingSlug?.includes(target)) {
          issues.push(`Possibly broken anchor: #${target}`);
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 4, 1.0) : 0;

      return {
        guardName: 'url-accessibility',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
