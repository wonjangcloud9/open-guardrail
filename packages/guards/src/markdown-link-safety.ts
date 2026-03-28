import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MarkdownLinkSafetyOptions {
  action: 'block' | 'warn';
}

const MD_LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;

export function markdownLinkSafety(options: MarkdownLinkSafetyOptions): Guard {
  return {
    name: 'markdown-link-safety',
    version: '0.1.0',
    description: 'Validates markdown links for javascript:, data: URIs, path traversal, and hidden links',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      let match: RegExpExecArray | null;
      const re = new RegExp(MD_LINK_RE.source, MD_LINK_RE.flags);
      while ((match = re.exec(text)) !== null) {
        const linkText = match[1];
        const href = match[2].trim();

        if (/^javascript:/i.test(href)) {
          issues.push('javascript_uri');
        }
        if (/^data:/i.test(href)) {
          issues.push('data_uri');
        }
        if (/\.\.\//.test(href) || /\.\.\\/.test(href)) {
          issues.push('path_traversal');
        }
        if (/^https?:\/\/\d{1,3}(\.\d{1,3}){3}/i.test(href)) {
          issues.push('ip_based_link');
        }
        if (linkText.trim() === '') {
          issues.push('hidden_link');
        }
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'markdown-link-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(issues.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
