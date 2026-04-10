import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ToolArgumentInjectionOptions {
  action: 'block' | 'warn';
}

const INJECTION_PATTERNS: { category: string; pattern: RegExp }[] = [
  { category: 'sql', pattern: /';\s*DROP\b/i },
  { category: 'sql', pattern: /UNION\s+SELECT/i },
  { category: 'sql', pattern: /OR\s+1\s*=\s*1/i },
  { category: 'sql', pattern: /'\s*OR\s+'[^']*'\s*=\s*'/i },
  { category: 'command', pattern: /\$\([^)]+\)/ },
  { category: 'command', pattern: /`[^`]+`/ },
  { category: 'command', pattern: /;\s*rm\s/i },
  { category: 'command', pattern: /\|\s*cat\s/i },
  { category: 'command', pattern: /&&\s*wget\s/i },
  { category: 'command', pattern: /&&\s*curl\s/i },
  { category: 'path_traversal', pattern: /\.\.\/\.\.\/\.\./ },
  { category: 'template', pattern: /\{\{/ },
  { category: 'template', pattern: /\$\{[^}]+\}/ },
  { category: 'template', pattern: /#\{[^}]+\}/ },
  { category: 'template', pattern: /<%=/ },
];

export function toolArgumentInjection(
  options: ToolArgumentInjectionOptions,
): Guard {
  return {
    name: 'tool-argument-injection',
    version: '0.1.0',
    description: 'Detects injection attacks within tool call arguments',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const found: { category: string; match: string }[] = [];

      for (const { category, pattern } of INJECTION_PATTERNS) {
        const m = text.match(pattern);
        if (m) {
          found.push({ category, match: m[0] });
        }
      }

      const triggered = found.length > 0;
      const categories = [...new Set(found.map((f) => f.category))];
      return {
        guardName: 'tool-argument-injection',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { injectionTypes: categories, matches: found }
          : undefined,
      };
    },
  };
}
