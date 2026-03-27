import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ToolAbuseOptions {
  action: 'block' | 'warn';
  /** Max tool calls allowed in window (default 20) */
  maxCallsInWindow?: number;
  /** Time window in ms (default 60000 = 1 min) */
  windowMs?: number;
  /** Deny specific tool sequences */
  denySequences?: string[][];
  /** Max calls to same tool in window (default 10) */
  maxSameToolCalls?: number;
}

interface ToolCall {
  tool: string;
  timestamp: number;
}

function parseToolName(text: string): string | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.tool === 'string') return parsed.tool;
  } catch { /* not a tool call */ }

  const match = text.match(/\btool[_\s]*(?:call|use|invoke)\s*[:\-]?\s*["']?(\w+)/i);
  return match ? match[1] : null;
}

export function toolAbuse(options: ToolAbuseOptions): Guard {
  const maxCalls = options.maxCallsInWindow ?? 20;
  const windowMs = options.windowMs ?? 60_000;
  const maxSame = options.maxSameToolCalls ?? 10;
  const callHistory: ToolCall[] = [];

  return {
    name: 'tool-abuse',
    version: '0.1.0',
    description: 'Detects excessive or suspicious tool call patterns',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const toolName = parseToolName(text);

      if (!toolName) {
        return {
          guardName: 'tool-abuse',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const now = Date.now();
      callHistory.push({ tool: toolName, timestamp: now });

      // Prune old entries
      const cutoff = now - windowMs;
      while (callHistory.length > 0 && callHistory[0].timestamp < cutoff) {
        callHistory.shift();
      }

      const violations: string[] = [];

      // Check total call rate
      if (callHistory.length > maxCalls) {
        violations.push(
          `${callHistory.length} tool calls in window (max ${maxCalls})`,
        );
      }

      // Check same-tool abuse
      const toolCounts = new Map<string, number>();
      for (const c of callHistory) {
        toolCounts.set(c.tool, (toolCounts.get(c.tool) ?? 0) + 1);
      }
      for (const [tool, count] of toolCounts) {
        if (count > maxSame) {
          violations.push(
            `${tool} called ${count} times (max ${maxSame})`,
          );
        }
      }

      // Check deny sequences
      if (options.denySequences) {
        const recent = callHistory.map((c) => c.tool);
        for (const seq of options.denySequences) {
          if (recent.length >= seq.length) {
            const tail = recent.slice(-seq.length);
            if (tail.every((t, i) => t === seq[i])) {
              violations.push(`Denied sequence: ${seq.join(' → ')}`);
            }
          }
        }
      }

      const triggered = violations.length > 0;
      return {
        guardName: 'tool-abuse',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations, recentCalls: callHistory.length } : undefined,
      };
    },
  };
}
