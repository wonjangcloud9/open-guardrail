import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ToolCallSequenceOptions {
  action: 'block' | 'warn';
  /** Pairs of [first, second] that are dangerous in sequence */
  dangerousSequences?: string[][];
}

const DEFAULT_DANGEROUS_SEQUENCES: string[][] = [
  ['read', 'delete'],
  ['query', 'drop'],
  ['list', 'delete'],
  ['get', 'send'],
  ['fetch', 'upload'],
  ['read', 'execute'],
  ['download', 'execute'],
  ['search', 'modify'],
  ['access', 'transfer'],
  ['view', 'export'],
];

function extractActions(text: string): string[] {
  const actions: string[] = [];
  const patterns = [
    /(?:tool_call|function_call|use_tool|Action)[\s:]*(\w+)/gi,
    /<tool>\s*(\w+)/gi,
    /(\w+)\s*\(/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      actions.push(match[1].toLowerCase());
    }
  }
  return actions;
}

export function toolCallSequence(options: ToolCallSequenceOptions): Guard {
  const sequences = options.dangerousSequences ?? DEFAULT_DANGEROUS_SEQUENCES;

  return {
    name: 'tool-call-sequence',
    version: '0.1.0',
    description: 'Detects dangerous sequential tool call patterns',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const actions = extractActions(text);
      const matched: string[][] = [];

      for (const [first, second] of sequences) {
        const firstIdx = actions.indexOf(first);
        if (firstIdx === -1) continue;
        for (let i = firstIdx + 1; i < actions.length; i++) {
          if (actions[i] === second) {
            matched.push([first, second]);
            break;
          }
        }
      }

      const triggered = matched.length > 0;
      return {
        guardName: 'tool-call-sequence',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedSequences: matched, extractedActions: actions }
          : undefined,
      };
    },
  };
}
