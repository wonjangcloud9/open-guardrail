import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PromptLeakOptions { action: 'block' | 'warn'; systemPromptSnippets?: string[]; }

const LEAK_PATTERNS: RegExp[] = [
  /\b(?:system\s+prompt|system\s+message|instructions?\s+(?:are|say|tell|read))\b/gi,
  /\bmy\s+(?:instructions|rules|guidelines|system\s+prompt)\s+(?:are|say|tell|include)\b/gi,
  /\b(?:here\s+(?:are|is)\s+my|let\s+me\s+share\s+my)\s+(?:instructions|prompt|rules)\b/gi,
  /\byou\s+(?:are|were)\s+instructed\s+to\b/gi,
  /\b(?:as\s+per|according\s+to)\s+my\s+(?:instructions|guidelines|programming)\b/gi,
];

export function promptLeak(options: PromptLeakOptions): Guard {
  return { name: 'prompt-leak', version: '0.1.0', description: 'Detect when LLM leaks its system prompt', category: 'security', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of LEAK_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      if (options.systemPromptSnippets) {
        const lower = text.toLowerCase();
        for (const s of options.systemPromptSnippets) { if (lower.includes(s.toLowerCase())) matched.push(`snippet: "${s.slice(0, 30)}"`); }
      }
      const triggered = matched.length > 0;
      return { guardName: 'prompt-leak', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `System prompt leak detected: ${matched[0]}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'LLM response reveals its system prompt or instructions' } : undefined,
      };
    },
  };
}
