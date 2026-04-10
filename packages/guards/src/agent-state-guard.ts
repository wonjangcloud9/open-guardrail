import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AgentStateGuardOptions {
  action: 'block' | 'warn';
  /** Map of state to allowed next states */
  validTransitions?: Record<string, string[]>;
  /** Initial state (default "idle") */
  initialState?: string;
}

const DEFAULT_TRANSITIONS: Record<string, string[]> = {
  idle: ['thinking', 'executing'],
  thinking: ['executing', 'idle', 'responding'],
  executing: ['responding', 'error', 'idle'],
  responding: ['idle', 'thinking'],
  error: ['idle'],
};

const STATE_INDICATORS = [
  /state:\s*(\w+)/i,
  /status:\s*(\w+)/i,
  /transitioning to\s+(\w+)/i,
  /moving to state\s+(\w+)/i,
  /entering phase\s+(\w+)/i,
];

export function agentStateGuard(options: AgentStateGuardOptions): Guard {
  const transitions = options.validTransitions ?? DEFAULT_TRANSITIONS;
  let currentState = options.initialState ?? 'idle';

  return {
    name: 'agent-state-guard',
    version: '0.1.0',
    description: 'Validates agent state transitions are safe and expected',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      let targetState: string | null = null;

      for (const re of STATE_INDICATORS) {
        const match = text.match(re);
        if (match) {
          targetState = match[1].toLowerCase();
          break;
        }
      }

      let triggered = false;
      let message: string | undefined;

      if (targetState) {
        const allowed = transitions[currentState];
        if (!allowed) {
          triggered = true;
          message = `Unknown current state: ${currentState}`;
        } else if (!allowed.includes(targetState)) {
          triggered = true;
          message = `Invalid transition: ${currentState} -> ${targetState}`;
        } else {
          currentState = targetState;
        }
      }

      return {
        guardName: 'agent-state-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { currentState, targetState, message }
          : undefined,
      };
    },
  };
}
