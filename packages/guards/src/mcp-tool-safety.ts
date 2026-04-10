import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface McpToolSafetyOptions {
  action: 'block' | 'warn';
  allowedServers?: string[];
  deniedTools?: string[];
}

const DEFAULT_DENIED_TOOLS: string[] = [
  'execute_command',
  'run_shell',
  'write_file',
  'delete_file',
  'send_request',
];

const MCP_PATTERNS: RegExp[] = [
  /mcp:\/\//i,
  /\bserver:\s*/i,
  /\btool:\s*/i,
  /\bmcp_call\b/i,
  /\buse_mcp_tool\b/i,
];

const SERVER_PATTERN = /(?:mcp:\/\/|server:\s*)(\S+)/i;
const TOOL_PATTERN = /(?:tool:\s*|mcp_call\s+|use_mcp_tool\s+)(\S+)/i;

export function mcpToolSafety(options: McpToolSafetyOptions): Guard {
  const denied = options.deniedTools ?? DEFAULT_DENIED_TOOLS;
  const allowed = options.allowedServers;

  return {
    name: 'mcp-tool-safety',
    version: '0.1.0',
    description:
      'Validates MCP (Model Context Protocol) tool calls for safety',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      const hasMcp = MCP_PATTERNS.some((p) => p.test(text));
      if (!hasMcp) {
        return {
          guardName: 'mcp-tool-safety',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const serverMatch = text.match(SERVER_PATTERN);
      if (allowed && serverMatch) {
        const server = serverMatch[1];
        if (!allowed.includes(server)) {
          issues.push(`Unauthorized MCP server: ${server}`);
        }
      }

      const toolMatch = text.match(TOOL_PATTERN);
      if (toolMatch) {
        const tool = toolMatch[1];
        if (denied.includes(tool)) {
          issues.push(`Denied MCP tool: ${tool}`);
        }
      }

      for (const d of denied) {
        if (text.includes(d) && !issues.some((i) => i.includes(d))) {
          issues.push(`Denied tool reference found: ${d}`);
        }
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'mcp-tool-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              issues,
              server: serverMatch?.[1],
              tool: toolMatch?.[1],
            }
          : undefined,
      };
    },
  };
}
