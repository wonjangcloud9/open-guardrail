import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MultiAgentSafetyOptions {
  action: 'block' | 'warn';
  /** Allowed agent names/roles */
  allowedAgents?: string[];
  /** Max messages between agents before human intervention */
  maxAgentTurns?: number;
  /** Detect agents impersonating other agents */
  detectImpersonation?: boolean;
}

const IMPERSONATION_PATTERNS = [
  /\bi\s+am\s+(?:agent|assistant|bot)\s+\w+\b/i,
  /\bspeaking\s+as\s+\w+\b/i,
  /\brole[:\s]+\w+agent\b/i,
  /\bswitching\s+(?:to|into)\s+\w+\s+(?:mode|role|persona)\b/i,
  /\b(?:impersonat|pretend|act\s+as)\w*\s+(?:agent|bot|assistant)\b/i,
];

export function multiAgentSafety(options: MultiAgentSafetyOptions): Guard {
  const maxTurns = options.maxAgentTurns ?? 10;
  const detectImpersonation = options.detectImpersonation ?? true;
  let turnCount = 0;

  return {
    name: 'multi-agent-safety',
    version: '0.1.0',
    description: 'Safety controls for multi-agent conversations',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];

      turnCount++;
      if (turnCount > maxTurns) {
        violations.push(`Agent conversation exceeded ${maxTurns} turns without human intervention`);
      }

      if (options.allowedAgents) {
        const agentMatch = text.match(/\bagent[:\s]+["']?(\w+)/i);
        if (agentMatch && !options.allowedAgents.includes(agentMatch[1])) {
          violations.push(`Unknown agent: ${agentMatch[1]}`);
        }
      }

      if (detectImpersonation) {
        for (const pat of IMPERSONATION_PATTERNS) {
          const m = text.match(pat);
          if (m) {
            violations.push(`Potential impersonation: ${m[0]}`);
            break;
          }
        }
      }

      const triggered = violations.length > 0;
      return {
        guardName: 'multi-agent-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations, turnCount } : undefined,
      };
    },
  };
}
