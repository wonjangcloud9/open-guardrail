import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PromptTemplateInjectOptions {
  action: 'block' | 'warn';
}

const PATTERNS = [
  /\{\{.*(?:system|admin|root|exec|eval).*\}\}/i,
  /\$\{.*(?:process|require|import|eval).*\}/i,
  /\{%.*(?:system|exec|import|os\.).*%\}/i,
  /<%.*(?:Runtime|Process|exec|system).*%>/i,
  /\{\{.*\|.*(?:safe|raw|escape).*\}\}/i,
  /f".*\{.*(?:__class__|__import__|__builtins__).*\}.*"/i,
];

export function promptTemplateInject(options: PromptTemplateInjectOptions): Guard {
  return {
    name: 'prompt-template-inject',
    version: '0.1.0',
    description: 'Detects template injection attacks in prompt templates',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of PATTERNS) { const m = text.match(p); if (m) matched.push(m[0].slice(0, 60)); }
      const triggered = matched.length > 0;
      return { guardName: 'prompt-template-inject', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { matched } : undefined };
    },
  };
}
