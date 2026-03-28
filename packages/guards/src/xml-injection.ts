import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface XmlInjectionOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /<!DOCTYPE\s+[^>]*ENTITY/i,
  /<!ENTITY\s+/i,
  /<!\[CDATA\[/i,
  /SYSTEM\s+["']file:\/\//i,
  /SYSTEM\s+["']https?:\/\//i,
  /<!DOCTYPE\s+\w+\s*\[/i,
  /&[a-zA-Z0-9]+;.*&[a-zA-Z0-9]+;.*&[a-zA-Z0-9]+;/,
  /<!ELEMENT\s+/i,
  /<!ATTLIST\s+/i,
  /xmlns:?\w*\s*=\s*["'].*["']/i,
];

export function xmlInjection(options: XmlInjectionOptions): Guard {
  return {
    name: 'xml-injection',
    version: '0.1.0',
    description: 'Detects XML injection and XXE attempts',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'xml-injection',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
