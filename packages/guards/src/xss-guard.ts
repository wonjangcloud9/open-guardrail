import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface XssGuardOptions {
  action: 'block' | 'warn' | 'sanitize';
}

const XSS_PATTERNS: [RegExp, string][] = [
  [/<script[\s>]/gi, 'script-tag'],
  [/javascript\s*:/gi, 'javascript-uri'],
  [/on(load|error|click|mouseover|focus|blur|submit|change|input|keyup|keydown)\s*=/gi, 'event-handler'],
  [/<iframe[\s>]/gi, 'iframe-tag'],
  [/<object[\s>]/gi, 'object-tag'],
  [/<embed[\s>]/gi, 'embed-tag'],
  [/<svg[\s>].*?on\w+\s*=/gi, 'svg-event'],
  [/expression\s*\(/gi, 'css-expression'],
  [/url\s*\(\s*['"]?\s*javascript/gi, 'css-javascript'],
  [/<img[^>]+onerror/gi, 'img-onerror'],
  [/document\.(cookie|domain|write)/gi, 'dom-access'],
  [/window\.(location|open)/gi, 'window-access'],
  [/eval\s*\(/gi, 'eval-call'],
  [/innerHTML\s*=/gi, 'innerhtml-assign'],
  [/fromCharCode/gi, 'char-encode'],
  [/<\/?\s*body/gi, 'body-tag'],
  [/<\/?\s*html/gi, 'html-tag'],
  [/<base[\s>]/gi, 'base-tag'],
  [/<form[\s>]/gi, 'form-tag'],
  [/<meta[\s>]/gi, 'meta-tag'],
];

function sanitize(text: string): string {
  let result = text;
  result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  result = result.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  result = result.replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '');
  result = result.replace(/javascript\s*:[^\s"']+/gi, '');
  result = result.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return result;
}

export function xssGuard(options: XssGuardOptions): Guard {
  return {
    name: 'xss-guard',
    version: '0.1.0',
    description: 'Cross-site scripting (XSS) detection guard',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const [pattern, label] of XSS_PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) matched.push(label);
      }

      const unique = [...new Set(matched)];
      const triggered = unique.length > 0;

      if (!triggered) {
        return {
          guardName: 'xss-guard',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (options.action === 'sanitize') {
        return {
          guardName: 'xss-guard',
          passed: true,
          action: 'override',
          overrideText: sanitize(text),
          latencyMs: Math.round(performance.now() - start),
          details: { matched: unique },
        };
      }

      return {
        guardName: 'xss-guard',
        passed: false,
        action: options.action,
        message: `XSS patterns detected: ${unique.join(', ')}`,
        latencyMs: Math.round(performance.now() - start),
        details: { matched: unique, reason: 'Text contains cross-site scripting patterns that could execute malicious code' },
      };
    },
  };
}
