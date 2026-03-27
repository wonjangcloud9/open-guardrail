import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RagPoisoningOptions {
  action: 'block' | 'warn';
  /** Injection patterns to detect in retrieved context */
  extraPatterns?: string[];
}

const POISON_PATTERNS: RegExp[] = [
  // Instruction injection hidden in retrieved docs
  /(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions?|rules?|guidelines?)/i,
  /\b(?:system|admin)\s*(?:prompt|instruction|override)\s*:/i,
  /\bnew\s+(?:instruction|directive|rule)\s*:/i,
  /\byou\s+(?:are|must)\s+now\s+(?:a|an|the)\b/i,
  /\bact\s+as\s+(?:if|though)\s+you\s+(?:are|were)\b/i,
  // Hidden text markers
  /\[(?:INST|SYS|SYSTEM)\]/i,
  /<<\s*(?:SYS|SYSTEM|INST)\s*>>/i,
  /\b(?:BEGIN|START)\s+(?:HIDDEN|SECRET|SYSTEM)\s+(?:TEXT|INSTRUCTION|PROMPT)\b/i,
  // Data exfiltration in context
  /(?:send|post|fetch|request)\s+(?:to|from)\s+https?:\/\//i,
  /\beval\s*\(|new\s+Function\s*\(/i,
  // Invisible unicode separators used to hide instructions
  /[\u200B\u200C\u200D\u2060\uFEFF]{3,}/,
  // Base64 encoded instructions
  /\b(?:decode|atob|base64)\s*\(\s*['"][A-Za-z0-9+/=]{20,}['"]\s*\)/i,
];

export function ragPoisoning(options: RagPoisoningOptions): Guard {
  const patterns = [...POISON_PATTERNS];

  if (options.extraPatterns) {
    for (const p of options.extraPatterns) {
      patterns.push(new RegExp(p, 'i'));
    }
  }

  return {
    name: 'rag-poisoning',
    version: '0.1.0',
    description: 'Detects poisoned or manipulated retrieval context in RAG pipelines',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pat of patterns) {
        const m = text.match(pat);
        if (m) matched.push(m[0]);
      }

      const triggered = matched.length > 0;
      return {
        guardName: 'rag-poisoning',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matched: [...new Set(matched)], count: matched.length }
          : undefined,
      };
    },
  };
}
