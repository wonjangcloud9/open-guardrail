import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ModelFingerprintOptions {
  action: 'block' | 'warn';
}

const FINGERPRINT_PATTERNS = [
  /\b(?:I am|I'm)\s+(?:an?\s+)?(?:AI|language model|LLM|GPT|Claude|ChatGPT|Gemini|Llama)\b/i,
  /\b(?:trained by|developed by|created by)\s+(?:OpenAI|Anthropic|Google|Meta|Microsoft)\b/i,
  /\b(?:GPT-[34]|Claude\s+\d|Gemini\s+\d|Llama\s+\d)\b/i,
  /\b(?:my training data|my training cutoff|my knowledge cutoff)\b/i,
  /\b(?:as a large language model|as an AI assistant)\b/i,
];

export function modelFingerprint(options: ModelFingerprintOptions): Guard {
  return {
    name: 'model-fingerprint',
    version: '0.1.0',
    description: 'Detects model identity/fingerprint leakage in output',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of FINGERPRINT_PATTERNS) { const m = text.match(p); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'model-fingerprint', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { matched } : undefined };
    },
  };
}
