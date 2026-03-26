import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PathTraversalOptions {
  action: 'block' | 'warn';
}

const PATH_PATTERNS: RegExp[] = [
  /\.\.\/|\.\.\\|\.\.\%2[fF]/g,
  /\/etc\/(?:passwd|shadow|hosts|sudoers)/gi,
  /\/proc\/self\//gi,
  /[a-zA-Z]:\\(?:Windows|Users|Program\s*Files)/gi,
  /~\/\.(?:ssh|bash|zsh|profile|env)/gi,
  /\/var\/(?:log|www|lib)/gi,
  /\$\{?(?:HOME|USER|PATH|PWD)\}?/g,
  /%(?:00|0a|0d|25|2e|2f|5c)/gi,
];

export function pathTraversal(options: PathTraversalOptions): Guard {
  return {
    name: 'path-traversal', version: '0.1.0',
    description: 'Detect path traversal and directory access attempts',
    category: 'security', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of PATH_PATTERNS) {
        const re = new RegExp(p.source, p.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0]);
      }
      const triggered = matched.length > 0;
      return {
        guardName: 'path-traversal', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `Path traversal detected: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Input contains file path traversal patterns' } : undefined,
      };
    },
  };
}
