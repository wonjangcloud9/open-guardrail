import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RecursionDepthOptions {
  action: 'block' | 'warn';
  /** Maximum allowed depth (default 5) */
  maxDepth?: number;
  /** Header or field name carrying depth info */
  depthField?: string;
}

function extractDepth(text: string, field: string): number | null {
  // Check JSON structure
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed[field] === 'number') {
      return parsed[field];
    }
  } catch { /* not JSON */ }

  // Check header-style: "X-Depth: 3" or "depth: 3"
  const headerRe = new RegExp(
    `(?:^|\\n)${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[=:]\\s*(\\d+)`,
    'im',
  );
  const m = text.match(headerRe);
  if (m) return parseInt(m[1], 10);

  // Check nested call indicators
  const delegatePatterns = [
    /\b(?:delegat|dispatch|forward|handoff|escalat)\w*/gi,
    /\bagent[_\s]*(?:call|invoke|spawn|fork)\b/gi,
    /\b(?:sub[_\s]*task|sub[_\s]*agent|child[_\s]*agent)\b/gi,
  ];

  let indicators = 0;
  for (const p of delegatePatterns) {
    const matches = text.match(p);
    if (matches) indicators += matches.length;
  }

  return indicators > 0 ? indicators : null;
}

export function recursionDepth(options: RecursionDepthOptions): Guard {
  const maxDepth = options.maxDepth ?? 5;
  const depthField = options.depthField ?? 'depth';
  let currentDepth = 0;

  return {
    name: 'recursion-depth',
    version: '0.1.0',
    description: 'Limits agent recursion and nesting depth',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const detected = extractDepth(text, depthField);

      if (detected !== null) {
        currentDepth = Math.max(currentDepth, detected);
      } else {
        currentDepth++;
      }

      const triggered = currentDepth > maxDepth;
      return {
        guardName: 'recursion-depth',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { currentDepth, maxDepth }
          : undefined,
      };
    },
  };
}
