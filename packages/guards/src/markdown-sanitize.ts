import type { Guard, GuardContext, GuardResult } from 'open-guardrail-core';

interface MarkdownSanitizeOptions {
  action: 'block' | 'warn' | 'override';
  /** Which patterns to sanitize. Default: all enabled. */
  rules?: {
    scriptLinks?: boolean;
    htmlTags?: boolean;
    dataUrls?: boolean;
    eventHandlers?: boolean;
  };
}

const SCRIPT_LINK = /\[([^\]]*)\]\(\s*javascript\s*:/gi;
const DATA_URL = /\[([^\]]*)\]\(\s*data\s*:/gi;
const HTML_SCRIPT = /<script[\s>][\s\S]*?<\/script>/gi;
const HTML_IFRAME = /<iframe[\s>][\s\S]*?(?:<\/iframe>|\/>)/gi;
const HTML_OBJECT = /<(?:object|embed|applet)[\s>][\s\S]*?(?:<\/(?:object|embed|applet)>|\/>)/gi;
const EVENT_HANDLER = /\bon\w+\s*=\s*["'][^"']*["']/gi;
const HTML_STYLE_EXPR = /style\s*=\s*["'][^"']*expression\s*\(/gi;

interface SanitizeRule {
  name: string;
  pattern: RegExp;
  replacement: string;
}

function buildRules(rules: Required<NonNullable<MarkdownSanitizeOptions['rules']>>): SanitizeRule[] {
  const all: SanitizeRule[] = [];

  if (rules.scriptLinks) {
    all.push({ name: 'javascript-link', pattern: SCRIPT_LINK, replacement: '[$1](blocked)' });
  }
  if (rules.dataUrls) {
    all.push({ name: 'data-url', pattern: DATA_URL, replacement: '[$1](blocked)' });
  }
  if (rules.htmlTags) {
    all.push({ name: 'script-tag', pattern: HTML_SCRIPT, replacement: '' });
    all.push({ name: 'iframe-tag', pattern: HTML_IFRAME, replacement: '' });
    all.push({ name: 'object-tag', pattern: HTML_OBJECT, replacement: '' });
  }
  if (rules.eventHandlers) {
    all.push({ name: 'event-handler', pattern: EVENT_HANDLER, replacement: '' });
    all.push({ name: 'style-expression', pattern: HTML_STYLE_EXPR, replacement: '' });
  }

  return all;
}

export function markdownSanitize(options: MarkdownSanitizeOptions): Guard {
  const rules = buildRules({
    scriptLinks: true,
    htmlTags: true,
    dataUrls: true,
    eventHandlers: true,
    ...options.rules,
  });

  return {
    name: 'markdown-sanitize',
    version: '1.0.0',
    description: 'Sanitize dangerous markdown and HTML (XSS, script injection)',
    category: 'security',
    supportedStages: ['output'],

    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      let sanitized = text;

      for (const rule of rules) {
        rule.pattern.lastIndex = 0;
        if (rule.pattern.test(sanitized)) {
          matched.push(rule.name);
          rule.pattern.lastIndex = 0;
          sanitized = sanitized.replace(rule.pattern, rule.replacement);
        }
      }

      const detected = matched.length > 0;
      const isOverride = detected && options.action === 'override';

      return {
        guardName: 'markdown-sanitize',
        passed: !detected || options.action === 'override',
        action: detected ? (isOverride ? 'override' : options.action) : 'allow',
        overrideText: isOverride ? sanitized : undefined,
        score: detected ? Math.min(matched.length / 4, 1.0) : 0,
        message: detected ? `Sanitized: ${matched.join(', ')}` : undefined,
        details: detected ? { matched, sanitized: isOverride } : undefined,
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}
