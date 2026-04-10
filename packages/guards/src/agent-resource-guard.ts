import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AgentResourceGuardOptions {
  action: 'block' | 'warn';
  maxUrls?: number;
  maxFileOps?: number;
  maxApiCalls?: number;
}

const URL_PATTERN = /https?:\/\//gi;
const FILE_OPS_PATTERNS = [/read file/gi, /write file/gi, /open\(/gi, /fs\./gi, /File\./g, /fopen/gi];
const API_PATTERNS = [/api\//gi, /endpoint/gi, /fetch\(/gi, /request\(/gi, /\bcurl\b/gi, /\bwget\b/gi];

function countMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags);
    const matches = text.match(re);
    if (matches) count += matches.length;
  }
  return count;
}

export function agentResourceGuard(options: AgentResourceGuardOptions): Guard {
  const maxUrls = options.maxUrls ?? 20;
  const maxFileOps = options.maxFileOps ?? 30;
  const maxApiCalls = options.maxApiCalls ?? 50;

  return {
    name: 'agent-resource-guard',
    version: '0.1.0',
    description: 'Detects excessive resource consumption patterns in agent behavior',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      const urlCount = (text.match(URL_PATTERN) || []).length;
      const fileOpsCount = countMatches(text, FILE_OPS_PATTERNS);
      const apiCallCount = countMatches(text, API_PATTERNS);

      const triggered = urlCount > maxUrls || fileOpsCount > maxFileOps || apiCallCount > maxApiCalls;

      return {
        guardName: 'agent-resource-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { urlCount, fileOpsCount, apiCallCount, maxUrls, maxFileOps, maxApiCalls }
          : undefined,
      };
    },
  };
}
